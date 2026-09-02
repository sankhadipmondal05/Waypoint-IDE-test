; ==============================================================================
; Waypoint IDE & College Lab Environment Setup
; Inno Setup 6.7+ Production Script (setup.iss)
; Features:
;  1. Welcome Screen
;  2. Install Waypoint IDE
;  3. Toolchains Checklist (MinGW-w64, OpenJDK 17, Python 3.11) with System PATH Registration
;  4. Ollama Check (Auto-uncheck & disabled if already present) + Model Selection
;     (Spawns Ollama daemon & model download asynchronously, letting installer finish & launch IDE)
; ==============================================================================

#define MyAppName "Waypoint IDE"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "Waypoint IDE"
#define MyAppURL "https://github.com/sankhadipmondal05/Waypoint-IDE-test"
#define MyAppExeName "waypoint-ide.exe"

[Setup]
AppId={{D8C9B0F3-7E1A-4F8A-9372-921A348BC51A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=..\dist-installer
OutputBaseFilename=Waypoint-IDE-Setup-{#MyAppVersion}
SetupIconFile=icons\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
WizardImageFile=icons\WizardImage.bmp
WizardSmallImageFile=icons\WizardSmallImage.bmp
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
ArchitecturesAllowed=x64compatible
ChangesEnvironment=yes
DisableWelcomePage=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Types]
Name: "full"; Description: "Full Development Suite (IDE + Compilers + Python + Java)"; Flags: iscustom
Name: "compact"; Description: "Waypoint IDE Only"

[Components]
Name: "ide"; Description: "Waypoint IDE Core Application"; Types: full compact; Flags: fixed
Name: "toolchains"; Description: "Language Compilers & System Toolchains"; Types: full
Name: "toolchains\mingw"; Description: "C/C++ Compiler Suite (MinGW-w64 GCC 14.2 -> C:\MinGW)"; Types: full
Name: "toolchains\jdk"; Description: "Java Development Kit (Eclipse Temurin OpenJDK 17 LTS)"; Types: full
Name: "toolchains\python"; Description: "Python 3.11 Runtime & Pip Package Manager"; Types: full

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startmenuicon"; Description: "Create Start Menu shortcut"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\src-tauri\target\release\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist; Components: ide
Source: "..\src-tauri\target\release\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist; Components: ide
Source: "..\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist; Components: ide
Source: "icons\icon.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"; Tasks: startmenuicon; Components: ide
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"; Tasks: startmenuicon
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon; Components: ide

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent; Components: ide

[Code]
var
  DownloadPage: TDownloadWizardPage;
  OllamaPage: TWizardPage;
  OllamaCheck: TNewCheckBox;
  OllamaStatusLabel: TLabel;
  ModelCombo: TNewComboBox;
  ModelDescriptionLabel: TLabel;
  IsOllamaDetected: Boolean;
  SelectedOllamaModel: String;

// Direct verified download URLs
const
  URL_MINGW = 'https://github.com/brechtsanders/winlibs_mingw/releases/download/14.2.0posix-19.1.1-12.0.0-ucrt-r2/winlibs-x86_64-posix-seh-gcc-14.2.0-llvm-19.1.1-mingw-w64ucrt-12.0.0-r2.zip';
  URL_JDK = 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.msi';
  URL_PYTHON = 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe';
  URL_OLLAMA = 'https://ollama.com/download/OllamaSetup.exe';

// ==============================================================================
// 1. SYSTEM INSPECTION & TOOLCHAIN DETECTION
// ==============================================================================
function CheckIsMinGWInstalled(): Boolean;
var
  SysPath: String;
begin
  Result := False;
  if FileExists('C:\MinGW\mingw64\bin\gcc.exe') or FileExists('C:\MinGW\bin\gcc.exe') or FileExists('C:\msys64\ucrt64\bin\gcc.exe') or FileExists('C:\msys64\mingw64\bin\gcc.exe') then
  begin
    Result := True;
    Exit;
  end;

  if RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', SysPath) then
  begin
    if (Pos('MINGW', Uppercase(SysPath)) > 0) or (Pos('MSYS64', Uppercase(SysPath)) > 0) or (Pos('GCC', Uppercase(SysPath)) > 0) then
      Result := True;
  end;
end;

function CheckIsJdkInstalled(): Boolean;
var
  JavaHome: String;
  SysPath: String;
begin
  Result := False;
  if RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'JAVA_HOME', JavaHome) then
  begin
    if DirExists(JavaHome) then
    begin
      Result := True;
      Exit;
    end;
  end;

  if RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', SysPath) then
  begin
    if (Pos('JAVA', Uppercase(SysPath)) > 0) or (Pos('JDK', Uppercase(SysPath)) > 0) or (Pos('TEMURIN', Uppercase(SysPath)) > 0) then
      Result := True;
  end;

  if DirExists('C:\Program Files\Eclipse Adoptium') or DirExists('C:\Program Files\Java') then
    Result := True;
end;

function CheckIsPythonInstalled(): Boolean;
var
  SysPath: String;
begin
  Result := False;
  if FileExists('C:\Program Files\Python311\python.exe') or FileExists('C:\Program Files\Python312\python.exe') or FileExists('C:\Python314\python.exe') or FileExists('C:\Python311\python.exe') then
  begin
    Result := True;
    Exit;
  end;

  if RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', SysPath) then
  begin
    if Pos('PYTHON', Uppercase(SysPath)) > 0 then
      Result := True;
  end;
end;

function CheckIsOllamaInstalled(): Boolean;
var
  LocalAppOllama: String;
  ProgFilesOllama: String;
  OutVal: String;
begin
  Result := False;

  if RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', OutVal) then
  begin
    if Pos('Ollama', OutVal) > 0 then
      Result := True;
  end;

  LocalAppOllama := ExpandConstant('{localappdata}\Programs\Ollama\ollama.exe');
  ProgFilesOllama := ExpandConstant('{autopf}\Ollama\ollama.exe');

  if FileExists(LocalAppOllama) or FileExists(ProgFilesOllama) then
    Result := True;
end;

function GetOllamaExecutablePath(): String;
var
  Candidate: String;
begin
  Candidate := ExpandConstant('{localappdata}\Programs\Ollama\ollama.exe');
  if FileExists(Candidate) then
  begin
    Result := Candidate;
    Exit;
  end;

  Candidate := ExpandConstant('{autopf}\Ollama\ollama.exe');
  if FileExists(Candidate) then
  begin
    Result := Candidate;
    Exit;
  end;

  Candidate := ExpandConstant('{sys}\ollama.exe');
  if FileExists(Candidate) then
  begin
    Result := Candidate;
    Exit;
  end;

  Result := 'ollama.exe';
end;

// ==============================================================================
// 2. STEP 4: OLLAMA CHECK & MODEL SELECTION PAGE
// ==============================================================================
procedure ModelComboOnChange(Sender: TObject);
begin
  case ModelCombo.ItemIndex of
    0:
      begin
        SelectedOllamaModel := 'qwen2.5-coder:1.5b';
        ModelDescriptionLabel.Caption := 'Size: ~980MB | Ultra-fast coding model. Runs smoothly with minimal RAM (4GB - 8GB).';
      end;
    1:
      begin
        SelectedOllamaModel := 'llama3.2:3b';
        ModelDescriptionLabel.Caption := 'Size: ~2.0GB | Balanced model with general comprehension & programming assistance.';
      end;
    2:
      begin
        SelectedOllamaModel := 'deepseek-r1:1.5b';
        ModelDescriptionLabel.Caption := 'Size: ~1.1GB | Reasoning specialist using Chain-of-Thought deliberation for logic & debugging.';
      end;
    3:
      begin
        SelectedOllamaModel := 'mistral:7b';
        ModelDescriptionLabel.Caption := 'Size: ~4.1GB | High precision model recommended for systems with 16GB+ RAM & GPU.';
      end;
  end;
end;

procedure CreateOllamaAndModelPage();
var
  SectionLabel: TLabel;
  ModelTitleLabel: TLabel;
  NoticeLabel: TLabel;
begin
  OllamaPage := CreateCustomPage(
    wpSelectComponents,
    'Local AI Inference Engine & Model',
    'Configure the Ollama runtime and choose the default AI model to pull for offline coding assistance.'
  );

  // 1. Ollama Runtime Checkbox & Status
  SectionLabel := TLabel.Create(OllamaPage);
  SectionLabel.Parent := OllamaPage.Surface;
  SectionLabel.Caption := 'Ollama AI Runtime Status:';
  SectionLabel.Left := ScaleX(0);
  SectionLabel.Top := ScaleY(5);
  SectionLabel.Font.Style := [fsBold];
  SectionLabel.Font.Size := 9;

  OllamaCheck := TNewCheckBox.Create(OllamaPage);
  OllamaCheck.Parent := OllamaPage.Surface;
  OllamaCheck.Left := ScaleX(0);
  OllamaCheck.Top := ScaleY(28);
  OllamaCheck.Width := ScaleX(410);
  OllamaCheck.Caption := 'Install Ollama Windows Engine (ollama.com)';
  OllamaCheck.Font.Size := 9;

  OllamaStatusLabel := TLabel.Create(OllamaPage);
  OllamaStatusLabel.Parent := OllamaPage.Surface;
  OllamaStatusLabel.Left := ScaleX(20);
  OllamaStatusLabel.Top := ScaleY(50);
  OllamaStatusLabel.Width := ScaleX(390);
  OllamaStatusLabel.Font.Size := 8;

  if IsOllamaDetected then
  begin
    OllamaCheck.Checked := False;
    OllamaCheck.Enabled := False; // Grey out option as requested
    OllamaStatusLabel.Caption := '✓ Ollama is already detected on this machine. Installation skipped.';
    OllamaStatusLabel.Font.Color := $2D6A4F; // Success green
  end
  else
  begin
    OllamaCheck.Checked := True;
    OllamaCheck.Enabled := True;
    OllamaStatusLabel.Caption := 'Ollama not found. The installer will download and install OllamaSetup silently.';
    OllamaStatusLabel.Font.Color := $7C7A73; // Muted text
  end;

  // 2. Model Selection Dropdown
  ModelTitleLabel := TLabel.Create(OllamaPage);
  ModelTitleLabel.Parent := OllamaPage.Surface;
  ModelTitleLabel.Caption := 'Select AI Model to download in background:';
  ModelTitleLabel.Left := ScaleX(0);
  ModelTitleLabel.Top := ScaleY(85);
  ModelTitleLabel.Font.Style := [fsBold];
  ModelTitleLabel.Font.Size := 9;

  ModelCombo := TNewComboBox.Create(OllamaPage);
  ModelCombo.Parent := OllamaPage.Surface;
  ModelCombo.Left := ScaleX(0);
  ModelCombo.Top := ScaleY(108);
  ModelCombo.Width := OllamaPage.SurfaceWidth;
  ModelCombo.Style := csDropDownList;
  ModelCombo.Font.Size := 9;
  ModelCombo.Items.Add('qwen2.5-coder:1.5b (Default - Lightweight Coding Model)');
  ModelCombo.Items.Add('llama3.2:3b (Balanced General & Coding Assistant)');
  ModelCombo.Items.Add('deepseek-r1:1.5b (Reasoning & Math Focus)');
  ModelCombo.Items.Add('mistral:7b (High Precision 7B Model)');
  ModelCombo.ItemIndex := 0;
  ModelCombo.OnChange := @ModelComboOnChange;

  ModelDescriptionLabel := TLabel.Create(OllamaPage);
  ModelDescriptionLabel.Parent := OllamaPage.Surface;
  ModelDescriptionLabel.AutoSize := False;
  ModelDescriptionLabel.Left := ScaleX(0);
  ModelDescriptionLabel.Top := ScaleY(142);
  ModelDescriptionLabel.Width := OllamaPage.SurfaceWidth;
  ModelDescriptionLabel.Height := ScaleY(40);
  ModelDescriptionLabel.WordWrap := True;
  ModelDescriptionLabel.Font.Color := $60686B;
  ModelDescriptionLabel.Font.Size := 8;

  NoticeLabel := TLabel.Create(OllamaPage);
  NoticeLabel.Parent := OllamaPage.Surface;
  NoticeLabel.AutoSize := False;
  NoticeLabel.Left := ScaleX(0);
  NoticeLabel.Top := ScaleY(185);
  NoticeLabel.Width := OllamaPage.SurfaceWidth;
  NoticeLabel.Height := ScaleY(45);
  NoticeLabel.WordWrap := True;
  NoticeLabel.Font.Size := 8;
  NoticeLabel.Caption := '⚡ Note: The installer will complete and launch Waypoint IDE immediately. The model download will proceed asynchronously in the background and become active in the IDE Status Bar as soon as it is ready.';

  ModelComboOnChange(nil);
end;

// ==============================================================================
// 3. WIZARD INITIALIZATION
// ==============================================================================
function InitializeSetup(): Boolean;
begin
  IsOllamaDetected := CheckIsOllamaInstalled();
  Result := True;
end;

procedure InitializeWizard();
begin
  DownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), SetupMessage(msgPreparingDesc), nil);
  CreateOllamaAndModelPage();

  // If compilers/runtimes are already detected on system, uncheck them by default
  if CheckIsMinGWInstalled() then
    WizardSelectComponents('!toolchains\mingw');

  if CheckIsJdkInstalled() then
    WizardSelectComponents('!toolchains\jdk');

  if CheckIsPythonInstalled() then
    WizardSelectComponents('!toolchains\python');
end;

// ==============================================================================
// 4. PRE-INSTALL DOWNLOAD PHASE
// ==============================================================================
function NextButtonClick(CurPageID: Integer): Boolean;
var
  Error: String;
begin
  if CurPageID = wpReady then
  begin
    DownloadPage.Clear;

    if WizardIsComponentSelected('toolchains\mingw') then
      DownloadPage.Add(URL_MINGW, 'mingw.zip', '');

    if WizardIsComponentSelected('toolchains\jdk') then
      DownloadPage.Add(URL_JDK, 'jdk17.msi', '');

    if WizardIsComponentSelected('toolchains\python') then
      DownloadPage.Add(URL_PYTHON, 'python311.exe', '');

    if OllamaCheck.Checked and (not IsOllamaDetected) then
      DownloadPage.Add(URL_OLLAMA, 'OllamaSetup.exe', '');

    DownloadPage.Show;
    try
      try
        DownloadPage.Download;
        Result := True;
      except
        if DownloadPage.AbortedByUser then
          Log('Download aborted by user.')
        else
        begin
          Error := Format('%s: %s', [DownloadPage.LastBaseNameOrUrl, GetExceptionMessage]);
          SuppressibleMsgBox(AddPeriod(Error), mbCriticalError, MB_OK, IDOK);
        end;
        Result := False;
      end;
    finally
      DownloadPage.Hide;
    end;
  end
  else
    Result := True;
end;

// ==============================================================================
// 5. SYSTEM PATH & ENVIRONMENT VARIABLE MANAGEMENT
// ==============================================================================
procedure AddPathToSystemEnvironment(const PathToAdd: String);
var
  CurrentPath: String;
  NewPath: String;
  PsScript: String;
  PsCmd: String;
  ResultCode: Integer;
begin
  // 1. Registry HKLM System Path
  if not RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', CurrentPath) then
    CurrentPath := '';

  if Pos(Uppercase(PathToAdd), Uppercase(CurrentPath)) = 0 then
  begin
    if (Length(CurrentPath) > 0) and (CurrentPath[Length(CurrentPath)] <> ';') then
      NewPath := CurrentPath + ';' + PathToAdd
    else
      NewPath := CurrentPath + PathToAdd;

    RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', NewPath);
  end;

  // 2. Machine-level persistent environment variable broadcast
  PsScript := '$p = ''' + PathToAdd + '''; ' +
    '$curr = [Environment]::GetEnvironmentVariable(''Path'', ''Machine''); ' +
    'if ($curr -notlike ''*'' + $p + ''*'') { ' +
    '  [Environment]::SetEnvironmentVariable(''Path'', $curr + '';'' + $p, ''Machine''); ' +
    '}';
  PsCmd := '-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "' + PsScript + '"';
  Exec('powershell.exe', PsCmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

// ==============================================================================
// 6. TOOLCHAIN INSTALLATION WITH LIVE PROGRESS BAR
// ==============================================================================
procedure ExtractZipArchiveWithProgress(const ZipFile, DestDir: String; ProgressPage: TOutputProgressWizardPage; BasePct, PctSpan: Integer);
var
  PsCmd: String;
  ResultCode: Integer;
begin
  ProgressPage.SetText('Extracting C/C++ Compiler Suite (MinGW-w64 GCC 14.2)...', 'Destination: ' + DestDir);
  ProgressPage.SetProgress(BasePct, 100);

  PsCmd := Format('-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath ''%s'' -DestinationPath ''%s'' -Force"', [ZipFile, DestDir]);
  Exec('powershell.exe', PsCmd, '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  
  ProgressPage.SetProgress(BasePct + PctSpan, 100);
end;

procedure InstallComponentsAndConfigure();
var
  ProgressPage: TOutputProgressWizardPage;
  TempDir: String;
  ResultCode: Integer;
  OllamaBin: String;
  BgScript: String;
  PsCmd: String;
  CurrentProgress: Integer;
  StepSpan: Integer;
  TotalSteps: Integer;
begin
  TempDir := ExpandConstant('{tmp}');

  // Calculate total active installation operations
  TotalSteps := 0;
  if WizardIsComponentSelected('toolchains\mingw') and FileExists(TempDir + '\mingw.zip') then TotalSteps := TotalSteps + 1;
  if WizardIsComponentSelected('toolchains\jdk') and FileExists(TempDir + '\jdk17.msi') then TotalSteps := TotalSteps + 1;
  if WizardIsComponentSelected('toolchains\python') and FileExists(TempDir + '\python311.exe') then TotalSteps := TotalSteps + 1;
  if OllamaCheck.Checked and (not IsOllamaDetected) and FileExists(TempDir + '\OllamaSetup.exe') then TotalSteps := TotalSteps + 1;
  if SelectedOllamaModel <> '' then TotalSteps := TotalSteps + 1;

  if TotalSteps = 0 then
    Exit;

  StepSpan := 90 div TotalSteps;
  CurrentProgress := 5;

  // Create and show dedicated live output progress page
  ProgressPage := CreateOutputProgressPage('Configuring Toolchains & Runtimes', 'Setting up compilers, system environment variables, and background services...');
  ProgressPage.Show;
  try
    ProgressPage.SetProgress(CurrentProgress, 100);

    // 1. MinGW C/C++ Extraction & System PATH
    if WizardIsComponentSelected('toolchains\mingw') and FileExists(TempDir + '\mingw.zip') then
    begin
      ProgressPage.SetText('Setting up C/C++ Compiler Suite (MinGW-w64 GCC 14.2)...', 'Extracting binary archives to C:\MinGW...');
      ForceDirectories('C:\MinGW');
      ExtractZipArchiveWithProgress(TempDir + '\mingw.zip', 'C:\MinGW', ProgressPage, CurrentProgress, StepSpan);
      
      ProgressPage.SetText('Registering C/C++ compiler in System PATH...', 'C:\MinGW\mingw64\bin');
      if DirExists('C:\MinGW\mingw64\bin') then
        AddPathToSystemEnvironment('C:\MinGW\mingw64\bin')
      else if DirExists('C:\MinGW\bin') then
        AddPathToSystemEnvironment('C:\MinGW\bin');

      CurrentProgress := CurrentProgress + StepSpan;
      ProgressPage.SetProgress(CurrentProgress, 100);
    end
    else
    begin
      // If already installed locally, ensure path is registered
      if DirExists('C:\MinGW\mingw64\bin') then
        AddPathToSystemEnvironment('C:\MinGW\mingw64\bin')
      else if DirExists('C:\MinGW\bin') then
        AddPathToSystemEnvironment('C:\MinGW\bin');
    end;

    // 2. OpenJDK 17 MSI Silent Install & PATH Registration
    if WizardIsComponentSelected('toolchains\jdk') and FileExists(TempDir + '\jdk17.msi') then
    begin
      ProgressPage.SetText('Installing Java Development Kit (Eclipse Temurin JDK 17 LTS)...', 'Running MSI setup with JAVA_HOME environment registration...');
      Exec('msiexec.exe', Format('/i "%s\jdk17.msi" /qn ADDLOCAL=FeatureMain,FeatureEnvironment,FeatureJarFileRunWith,FeatureJavaHome /norestart', [TempDir]), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      
      CurrentProgress := CurrentProgress + StepSpan;
      ProgressPage.SetProgress(CurrentProgress, 100);
    end;

    // 3. Python 3.11 Silent Install & PATH Registration
    if WizardIsComponentSelected('toolchains\python') and FileExists(TempDir + '\python311.exe') then
    begin
      ProgressPage.SetText('Installing Python 3.11 Runtime & Pip...', 'Configuring global interpreter and PATH variables...');
      Exec(TempDir + '\python311.exe', '/quiet InstallAllUsers=1 PrependPath=1 Include_test=0', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      AddPathToSystemEnvironment('C:\Program Files\Python311');
      AddPathToSystemEnvironment('C:\Program Files\Python311\Scripts');

      CurrentProgress := CurrentProgress + StepSpan;
      ProgressPage.SetProgress(CurrentProgress, 100);
    end
    else
    begin
      // If Python exists in standard path, ensure registered
      if DirExists('C:\Program Files\Python311') then
      begin
        AddPathToSystemEnvironment('C:\Program Files\Python311');
        AddPathToSystemEnvironment('C:\Program Files\Python311\Scripts');
      end
      else if DirExists('C:\Python314') then
      begin
        AddPathToSystemEnvironment('C:\Python314');
        AddPathToSystemEnvironment('C:\Python314\Scripts');
      end;
    end;

    // 4. Ollama Runtime Silent Install (if selected)
    if OllamaCheck.Checked and (not IsOllamaDetected) and FileExists(TempDir + '\OllamaSetup.exe') then
    begin
      ProgressPage.SetText('Installing Ollama AI Server...', 'Configuring background engine...');
      Exec(TempDir + '\OllamaSetup.exe', '/VERYSILENT /NORESTART', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      Sleep(2000);

      CurrentProgress := CurrentProgress + StepSpan;
      ProgressPage.SetProgress(CurrentProgress, 100);
    end;

    // 5. Asynchronous Background Model Pull & Daemon Start
    if SelectedOllamaModel <> '' then
    begin
      ProgressPage.SetText(Format('Spawning background pull for model "%s"...', [SelectedOllamaModel]), 'Launching background daemon...');
      OllamaBin := GetOllamaExecutablePath();

      BgScript := '$ollama = ''' + OllamaBin + '''; ' +
        'if (!(Test-Path $ollama)) { $ollama = (Get-Command ollama.exe -ErrorAction SilentlyContinue).Source; }; ' +
        'if (!(Test-Path $ollama)) { $ollama = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"; }; ' +
        'if (!(Test-Path $ollama)) { $ollama = (Get-ChildItem -Path "$env:USERPROFILE\AppData\Local\Programs\Ollama\ollama.exe" -ErrorAction SilentlyContinue).FullName; }; ' +
        'if (Test-Path $ollama) { ' +
        '  $running = Get-Process -Name "ollama" -ErrorAction SilentlyContinue; ' +
        '  if (!$running) { ' +
        '    Start-Process -FilePath $ollama -ArgumentList "serve" -WindowStyle Hidden; ' +
        '    Start-Sleep -Seconds 2; ' +
        '  }; ' +
        '  Start-Process -FilePath $ollama -ArgumentList "pull ' + SelectedOllamaModel + '" -WindowStyle Hidden; ' +
        '}';

      PsCmd := '-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "' + BgScript + '"';
      Exec('powershell.exe', PsCmd, '', SW_HIDE, ewNoWait, ResultCode);

      ProgressPage.SetProgress(100, 100);
    end;
  finally
    ProgressPage.Hide;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    InstallComponentsAndConfigure();
  end;
end;
