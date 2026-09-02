use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandOutput {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ToolchainScanResult {
    pub id: String,
    pub installed: bool,
    pub version: String,
}

#[tauri::command]
fn run_terminal_command(command: String, cwd: Option<String>) -> CommandOutput {
    let temp_dir = std::env::temp_dir().join("waypoint_runner");
    let working_dir = cwd.map(std::path::PathBuf::from).unwrap_or(temp_dir);
    let _ = std::fs::create_dir_all(&working_dir);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let output = Command::new("cmd")
            .args(["/C", &command])
            .current_dir(&working_dir)
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        match output {
            Ok(out) => CommandOutput {
                success: out.status.success(),
                stdout: String::from_utf8_lossy(&out.stdout).to_string(),
                stderr: String::from_utf8_lossy(&out.stderr).to_string(),
                exit_code: out.status.code(),
            },
            Err(e) => CommandOutput {
                success: false,
                stdout: String::new(),
                stderr: e.to_string(),
                exit_code: Some(-1),
            },
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("sh").args(["-c", &command]).output();

        match output {
            Ok(out) => CommandOutput {
                success: out.status.success(),
                stdout: String::from_utf8_lossy(&out.stdout).to_string(),
                stderr: String::from_utf8_lossy(&out.stderr).to_string(),
                exit_code: out.status.code(),
            },
            Err(e) => CommandOutput {
                success: false,
                stdout: String::new(),
                stderr: e.to_string(),
                exit_code: Some(-1),
            },
        }
    }
}

#[tauri::command]
fn compile_and_run_file(file_name: String, content: String, stdin_input: Option<String>) -> CommandOutput {
    let ext = file_name.split('.').last().unwrap_or("").to_lowercase();
    let temp_dir = std::env::temp_dir().join("waypoint_runner");
    let _ = std::fs::create_dir_all(&temp_dir);

    let src_path = temp_dir.join(&file_name);
    if let Err(e) = std::fs::write(&src_path, &content) {
        return CommandOutput {
            success: false,
            stdout: String::new(),
            stderr: format!("Failed to prepare source file for execution: {}", e),
            exit_code: Some(-1),
        };
    }

    #[cfg(target_os = "windows")]
    use std::os::windows::process::CommandExt;
    #[cfg(target_os = "windows")]
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let input_bytes = stdin_input.unwrap_or_default();

    let temp_dir_str = temp_dir.to_string_lossy().to_string();
    let clean_stderr = |raw_err: &str| -> String {
        let mut cleaned = raw_err
            .replace(&src_path.to_string_lossy().to_string(), &file_name)
            .replace(&temp_dir_str, ".")
            .replace("/waypoint_runner/", "")
            .replace("\\waypoint_runner\\", "");

        // Clean toolchain internal paths like C:/MinGW/mingw64/bin/.../ld.exe:
        if cleaned.contains("undefined reference to `WinMain'") || cleaned.contains("undefined reference to `main'") {
            cleaned = format!(
                "Linker Error: No 'main()' function found in {}.\nEvery executable program in C/C++ requires a 'main()' function as the entry point.\n\nDid you forget to add:\nint main() {{\n    // your code here\n    return 0;\n}}",
                file_name
            );
        }

        cleaned
    };

    match ext.as_str() {
        "py" | "python" => {
            // Directly spawn python with stdin pipe (-u for unbuffered real-time stdout/stdin)
            use std::io::Write;
            #[cfg(target_os = "windows")]
            let child_opt = {
                let mut cmd = Command::new("python");
                cmd.args(["-u", &file_name])
                    .current_dir(&temp_dir)
                    .stdin(std::process::Stdio::piped())
                    .stdout(std::process::Stdio::piped())
                    .stderr(std::process::Stdio::piped())
                    .creation_flags(CREATE_NO_WINDOW);
                cmd.spawn().or_else(|_| {
                    let mut py_cmd = Command::new("py");
                    py_cmd.args(["-u", &file_name])
                        .current_dir(&temp_dir)
                        .stdin(std::process::Stdio::piped())
                        .stdout(std::process::Stdio::piped())
                        .stderr(std::process::Stdio::piped())
                        .creation_flags(CREATE_NO_WINDOW);
                    py_cmd.spawn()
                })
            };

            #[cfg(not(target_os = "windows"))]
            let child_opt = {
                let mut cmd = Command::new("python3");
                cmd.args(["-u", &file_name])
                    .current_dir(&temp_dir)
                    .stdin(std::process::Stdio::piped())
                    .stdout(std::process::Stdio::piped())
                    .stderr(std::process::Stdio::piped());
                cmd.spawn()
            };

            match child_opt {
                Ok(mut child) => {
                    if !input_bytes.is_empty() {
                        if let Some(mut stdin) = child.stdin.take() {
                            let _ = stdin.write_all(input_bytes.as_bytes());
                        }
                    }
                    match child.wait_with_output() {
                        Ok(out) => {
                            let stderr_str = clean_stderr(&String::from_utf8_lossy(&out.stderr));
                            CommandOutput {
                                success: out.status.success(),
                                stdout: String::from_utf8_lossy(&out.stdout).to_string(),
                                stderr: stderr_str,
                                exit_code: out.status.code(),
                            }
                        }
                        Err(e) => CommandOutput {
                            success: false,
                            stdout: String::new(),
                            stderr: format!("Process execution failed: {}", e),
                            exit_code: Some(-1),
                        },
                    }
                }
                Err(e) => CommandOutput {
                    success: false,
                    stdout: String::new(),
                    stderr: format!("Python executable not found in system PATH. Error: {}", e),
                    exit_code: Some(-1),
                },
            }
        }
        "cpp" | "cxx" | "cc" => {
            let out_exe_name = if cfg!(target_os = "windows") { "program.exe" } else { "program" };
            let out_exe_path = temp_dir.join(out_exe_name);

            // 1. Fast compile with g++ (without heavy -O2 optimization passes)
            let mut compile_cmd = Command::new("g++");
            compile_cmd
                .args(["-std=c++17", &file_name, "-o", out_exe_name])
                .current_dir(&temp_dir);

            #[cfg(target_os = "windows")]
            compile_cmd.creation_flags(CREATE_NO_WINDOW);

            match compile_cmd.output() {
                Ok(compile_out) => {
                    if !compile_out.status.success() {
                        let stderr_str = clean_stderr(&String::from_utf8_lossy(&compile_out.stderr));
                        return CommandOutput {
                            success: false,
                            stdout: String::from_utf8_lossy(&compile_out.stdout).to_string(),
                            stderr: stderr_str,
                            exit_code: compile_out.status.code(),
                        };
                    }
                }
                Err(e) => {
                    return CommandOutput {
                        success: false,
                        stdout: String::new(),
                        stderr: format!("G++ compiler not found in system PATH. Error: {}", e),
                        exit_code: Some(-1),
                    };
                }
            }

            // 2. Run compiled binary directly with piped stdin
            use std::io::Write;
            let mut run_cmd = Command::new(&out_exe_path);
            run_cmd
                .current_dir(&temp_dir)
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped());
            #[cfg(target_os = "windows")]
            run_cmd.creation_flags(CREATE_NO_WINDOW);

            match run_cmd.spawn() {
                Ok(mut child) => {
                    if !input_bytes.is_empty() {
                        if let Some(mut stdin) = child.stdin.take() {
                            let _ = stdin.write_all(input_bytes.as_bytes());
                        }
                    }
                    match child.wait_with_output() {
                        Ok(run_out) => {
                            let stderr_str = clean_stderr(&String::from_utf8_lossy(&run_out.stderr));
                            CommandOutput {
                                success: run_out.status.success(),
                                stdout: String::from_utf8_lossy(&run_out.stdout).to_string(),
                                stderr: stderr_str,
                                exit_code: run_out.status.code(),
                            }
                        }
                        Err(e) => CommandOutput {
                            success: false,
                            stdout: String::new(),
                            stderr: format!("Failed to execute compiled binary: {}", e),
                            exit_code: Some(-1),
                        },
                    }
                }
                Err(e) => CommandOutput {
                    success: false,
                    stdout: String::new(),
                    stderr: format!("Failed to launch compiled binary: {}", e),
                    exit_code: Some(-1),
                },
            }
        }
        "c" => {
            let out_exe_name = if cfg!(target_os = "windows") { "program.exe" } else { "program" };
            let out_exe_path = temp_dir.join(out_exe_name);

            // 1. Fast compile with gcc
            let mut compile_cmd = Command::new("gcc");
            compile_cmd
                .args([&file_name, "-o", out_exe_name])
                .current_dir(&temp_dir);

            #[cfg(target_os = "windows")]
            compile_cmd.creation_flags(CREATE_NO_WINDOW);

            match compile_cmd.output() {
                Ok(compile_out) => {
                    if !compile_out.status.success() {
                        let stderr_str = clean_stderr(&String::from_utf8_lossy(&compile_out.stderr));
                        return CommandOutput {
                            success: false,
                            stdout: String::from_utf8_lossy(&compile_out.stdout).to_string(),
                            stderr: stderr_str,
                            exit_code: compile_out.status.code(),
                        };
                    }
                }
                Err(e) => {
                    return CommandOutput {
                        success: false,
                        stdout: String::new(),
                        stderr: format!("GCC compiler not found in system PATH. Error: {}", e),
                        exit_code: Some(-1),
                    };
                }
            }

            // 2. Run compiled binary directly with piped stdin
            use std::io::Write;
            let mut run_cmd = Command::new(&out_exe_path);
            run_cmd
                .current_dir(&temp_dir)
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped());
            #[cfg(target_os = "windows")]
            run_cmd.creation_flags(CREATE_NO_WINDOW);

            match run_cmd.spawn() {
                Ok(mut child) => {
                    if !input_bytes.is_empty() {
                        if let Some(mut stdin) = child.stdin.take() {
                            let _ = stdin.write_all(input_bytes.as_bytes());
                        }
                    }
                    match child.wait_with_output() {
                        Ok(run_out) => {
                            let stderr_str = clean_stderr(&String::from_utf8_lossy(&run_out.stderr));
                            CommandOutput {
                                success: run_out.status.success(),
                                stdout: String::from_utf8_lossy(&run_out.stdout).to_string(),
                                stderr: stderr_str,
                                exit_code: run_out.status.code(),
                            }
                        }
                        Err(e) => CommandOutput {
                            success: false,
                            stdout: String::new(),
                            stderr: format!("Failed to execute compiled binary: {}", e),
                            exit_code: Some(-1),
                        },
                    }
                }
                Err(e) => CommandOutput {
                    success: false,
                    stdout: String::new(),
                    stderr: format!("Failed to launch compiled binary: {}", e),
                    exit_code: Some(-1),
                },
            }
        }
        "java" => {
            let class_name = file_name.trim_end_matches(".java");

            // 1. Compile with javac
            let mut javac_cmd = Command::new("javac");
            javac_cmd.arg(&file_name).current_dir(&temp_dir);
            #[cfg(target_os = "windows")]
            javac_cmd.creation_flags(CREATE_NO_WINDOW);

            match javac_cmd.output() {
                Ok(compile_out) => {
                    if !compile_out.status.success() {
                        let stderr_str = clean_stderr(&String::from_utf8_lossy(&compile_out.stderr));
                        return CommandOutput {
                            success: false,
                            stdout: String::from_utf8_lossy(&compile_out.stdout).to_string(),
                            stderr: stderr_str,
                            exit_code: compile_out.status.code(),
                        };
                    }
                }
                Err(e) => {
                    return CommandOutput {
                        success: false,
                        stdout: String::new(),
                        stderr: format!("Javac compiler not found in system PATH. Error: {}", e),
                        exit_code: Some(-1),
                    };
                }
            }

            // 2. Run java bytecode with piped stdin
            use std::io::Write;
            let mut java_cmd = Command::new("java");
            java_cmd
                .args(["-cp", ".", class_name])
                .current_dir(&temp_dir)
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped());
            #[cfg(target_os = "windows")]
            java_cmd.creation_flags(CREATE_NO_WINDOW);

            match java_cmd.spawn() {
                Ok(mut child) => {
                    if !input_bytes.is_empty() {
                        if let Some(mut stdin) = child.stdin.take() {
                            let _ = stdin.write_all(input_bytes.as_bytes());
                        }
                    }
                    match child.wait_with_output() {
                        Ok(run_out) => {
                            let stderr_str = clean_stderr(&String::from_utf8_lossy(&run_out.stderr));
                            CommandOutput {
                                success: run_out.status.success(),
                                stdout: String::from_utf8_lossy(&run_out.stdout).to_string(),
                                stderr: stderr_str,
                                exit_code: run_out.status.code(),
                            }
                        }
                        Err(e) => CommandOutput {
                            success: false,
                            stdout: String::new(),
                            stderr: format!("Failed to execute java program: {}", e),
                            exit_code: Some(-1),
                        },
                    }
                }
                Err(e) => CommandOutput {
                    success: false,
                    stdout: String::new(),
                    stderr: format!("Java runtime not found in system PATH. Error: {}", e),
                    exit_code: Some(-1),
                },
            }
        }
        _ => CommandOutput {
            success: true,
            stdout: format!("File {} checked.", file_name),
            stderr: String::new(),
            exit_code: Some(0),
        },
    }
}

#[tauri::command]
fn scan_system_toolchains() -> Vec<ToolchainScanResult> {
    let check_items = vec![
        ("c", "gcc", "gcc --version"),
        ("cpp", "g++", "g++ --version"),
        ("python", "python", "python --version"),
        ("javac", "javac", "javac --version"),
        ("ollama", "ollama", "ollama --version"),
    ];

    let mut results = Vec::new();

    for (id, _bin, cmd) in check_items {
        #[cfg(target_os = "windows")]
        let res = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", cmd])
            .output();

        #[cfg(not(target_os = "windows"))]
        let res = Command::new("sh").args(["-c", cmd]).output();

        match res {
            Ok(out) => {
                if out.status.success() {
                    let out_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    let first_line = out_str.lines().next().unwrap_or("").to_string();
                    results.push(ToolchainScanResult {
                        id: id.to_string(),
                        installed: true,
                        version: if first_line.is_empty() {
                            "Ready".to_string()
                        } else {
                            first_line
                        },
                    });
                } else {
                    results.push(ToolchainScanResult {
                        id: id.to_string(),
                        installed: false,
                        version: String::new(),
                    });
                }
            }
            Err(_) => {
                results.push(ToolchainScanResult {
                    id: id.to_string(),
                    installed: false,
                    version: String::new(),
                });
            }
        }
    }

    results
}

#[tauri::command]
fn ensure_ollama_running() -> CommandOutput {
    std::thread::spawn(|| {
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;

            // Check if ollama is already running on localhost
            if let Ok(_) = std::net::TcpStream::connect_timeout(
                &std::net::SocketAddr::from(([127, 0, 0, 1], 11434)),
                std::time::Duration::from_millis(150),
            ) {
                return;
            }

            // Fast candidate path checks
            let mut ollama_exe = std::path::PathBuf::from("ollama.exe");
            if let Ok(local_app) = std::env::var("LOCALAPPDATA") {
                let candidate = std::path::PathBuf::from(local_app)
                    .join("Programs")
                    .join("Ollama")
                    .join("ollama.exe");
                if candidate.exists() {
                    ollama_exe = candidate;
                }
            }

            let mut cmd = Command::new(&ollama_exe);
            cmd.arg("serve").creation_flags(CREATE_NO_WINDOW);
            let _ = cmd.spawn();
        }

        #[cfg(not(target_os = "windows"))]
        {
            if let Ok(_) = std::net::TcpStream::connect_timeout(
                &std::net::SocketAddr::from(([127, 0, 0, 1], 11434)),
                std::time::Duration::from_millis(150),
            ) {
                return;
            }
            let mut cmd = Command::new("ollama");
            cmd.arg("serve");
            let _ = cmd.spawn();
        }
    });

    CommandOutput {
        success: true,
        stdout: "Ollama initialization dispatched".to_string(),
        stderr: String::new(),
        exit_code: Some(0),
    }
}

#[tauri::command]
fn kill_ollama_daemon() -> CommandOutput {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let mut cmd = Command::new("taskkill");
        cmd.args(["/F", "/IM", "ollama.exe", "/T"]).creation_flags(CREATE_NO_WINDOW);
        let _ = cmd.output();
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = Command::new("pkill").args(["-f", "ollama serve"]).output();
    }

    CommandOutput {
        success: true,
        stdout: "Ollama daemon stopped".to_string(),
        stderr: String::new(),
        exit_code: Some(0),
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaModelStatus {
    pub is_running: bool,
    pub models: Vec<String>,
}

#[tauri::command]
fn get_ollama_status() -> OllamaModelStatus {
    use std::io::{Read, Write};
    use std::net::TcpStream;
    use std::time::Duration;

    // Connect to Ollama port directly with 150ms timeout
    let mut stream = match TcpStream::connect_timeout(
        &std::net::SocketAddr::from(([127, 0, 0, 1], 11434)),
        Duration::from_millis(150),
    ) {
        Ok(s) => s,
        Err(_) => {
            return OllamaModelStatus {
                is_running: false,
                models: Vec::new(),
            };
        }
    };

    let _ = stream.set_read_timeout(Some(Duration::from_millis(600)));
    let _ = stream.set_write_timeout(Some(Duration::from_millis(300)));

    let request = "GET /api/tags HTTP/1.1\r\nHost: localhost:11434\r\nUser-Agent: Waypoint-IDE\r\nConnection: close\r\n\r\n";
    if stream.write_all(request.as_bytes()).is_err() {
        return OllamaModelStatus {
            is_running: true,
            models: Vec::new(),
        };
    }

    let mut response = Vec::new();
    let _ = stream.read_to_end(&mut response);
    let resp_str = String::from_utf8_lossy(&response);

    let mut models = Vec::new();
    if let Some(json_start) = resp_str.find("\r\n\r\n") {
        let json_body = &resp_str[json_start + 4..];
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(json_body) {
            if let Some(arr) = val.get("models").and_then(|m| m.as_array()) {
                for item in arr {
                    if let Some(name) = item.get("name").and_then(|n| n.as_str()) {
                        models.push(name.to_string());
                    }
                }
            }
        }
    }

    OllamaModelStatus {
        is_running: true,
        models,
    }
}

#[tauri::command]
fn trigger_ollama_pull(model: String) -> CommandOutput {
    let model_to_pull = model.clone();
    std::thread::spawn(move || {
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            let mut ollama_exe = std::path::PathBuf::from("ollama.exe");
            if let Ok(local_app) = std::env::var("LOCALAPPDATA") {
                let candidate = std::path::PathBuf::from(local_app)
                    .join("Programs")
                    .join("Ollama")
                    .join("ollama.exe");
                if candidate.exists() {
                    ollama_exe = candidate;
                }
            }
            let _ = Command::new(&ollama_exe)
                .args(["pull", &model_to_pull])
                .creation_flags(CREATE_NO_WINDOW)
                .output();
        }

        #[cfg(not(target_os = "windows"))]
        {
            let _ = Command::new("ollama").args(["pull", &model_to_pull]).output();
        }
    });

    CommandOutput {
        success: true,
        stdout: format!("Triggered pull for {}", model),
        stderr: String::new(),
        exit_code: Some(0),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|_app| {
        // Asynchronously check and start Ollama daemon without blocking window render
        std::thread::spawn(|| {
            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                const CREATE_NO_WINDOW: u32 = 0x08000000;

                if let Ok(_) = std::net::TcpStream::connect_timeout(
                    &std::net::SocketAddr::from(([127, 0, 0, 1], 11434)),
                    std::time::Duration::from_millis(150),
                ) {
                    return;
                }

                let mut ollama_exe = std::path::PathBuf::from("ollama.exe");
                if let Ok(local_app) = std::env::var("LOCALAPPDATA") {
                    let candidate = std::path::PathBuf::from(local_app)
                        .join("Programs")
                        .join("Ollama")
                        .join("ollama.exe");
                    if candidate.exists() {
                        ollama_exe = candidate;
                    }
                }

                let mut cmd = Command::new(&ollama_exe);
                cmd.arg("serve").creation_flags(CREATE_NO_WINDOW);
                let _ = cmd.spawn();
            }
        });
        Ok(())
    })
    .on_window_event(|_window, event| {
        if let tauri::WindowEvent::Destroyed = event {
            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                const CREATE_NO_WINDOW: u32 = 0x08000000;
                let _ = Command::new("taskkill")
                    .args(["/F", "/IM", "ollama.exe", "/T"])
                    .creation_flags(CREATE_NO_WINDOW)
                    .output();
            }
            #[cfg(not(target_os = "windows"))]
            {
                let _ = Command::new("pkill").args(["-f", "ollama serve"]).output();
            }
        }
    })
    .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
    .invoke_handler(tauri::generate_handler![
        run_terminal_command,
        compile_and_run_file,
        scan_system_toolchains,
        ensure_ollama_running,
        kill_ollama_daemon,
        get_ollama_status,
        trigger_ollama_pull
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
