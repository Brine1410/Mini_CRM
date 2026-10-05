# Downloads the backend libraries from Maven Central into backend/lib.
# Only needed if backend/lib is empty (e.g. a hand-made copy of the sources).
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))  # repo root

$MBASE = 'https://repo1.maven.org/maven2'
$LIBS = @(
  '/javax/servlet/javax.servlet-api/3.1.0/javax.servlet-api-3.1.0.jar',
  '/org/eclipse/jetty/jetty-server/9.4.48.v20220622/jetty-server-9.4.48.v20220622.jar',
  '/org/eclipse/jetty/jetty-servlet/9.4.48.v20220622/jetty-servlet-9.4.48.v20220622.jar',
  '/org/eclipse/jetty/jetty-http/9.4.48.v20220622/jetty-http-9.4.48.v20220622.jar',
  '/org/eclipse/jetty/jetty-io/9.4.48.v20220622/jetty-io-9.4.48.v20220622.jar',
  '/org/eclipse/jetty/jetty-util/9.4.48.v20220622/jetty-util-9.4.48.v20220622.jar',
  '/org/eclipse/jetty/jetty-util-ajax/9.4.48.v20220622/jetty-util-ajax-9.4.48.v20220622.jar',
  '/org/eclipse/jetty/jetty-security/9.4.48.v20220622/jetty-security-9.4.48.v20220622.jar',
  '/com/h2database/h2/2.2.220/h2-2.2.220.jar',
  '/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar',
  '/com/google/code/gson/gson/2.9.1/gson-2.9.1.jar',
  '/org/codehaus/janino/janino/3.1.9/janino-3.1.9.jar',
  '/org/codehaus/janino/commons-compiler/3.1.9/commons-compiler-3.1.9.jar'
)

New-Item -ItemType Directory -Force -Path 'backend/lib' | Out-Null
foreach ($path in $LIBS) {
  $name = Split-Path -Leaf $path
  $dest = "backend/lib/$name"
  if (Test-Path $dest) { Write-Host "  have  $name"; continue }
  Write-Host "  fetch $name"
  Invoke-WebRequest -Uri "$MBASE$path" -OutFile $dest
}
Write-Host "[fetch-libs] backend/lib is ready"
