# Compiles the Java servlet backend into backend/out/classes (Windows edition).
# Uses javac when a JDK is installed, otherwise falls back to Janino (a plain
# JRE is enough) just like build.sh.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))  # repo root

$LIB = 'backend/lib'
$OUT = 'backend/out/classes'
$SOURCES = Get-ChildItem 'backend/src/main/java' -Recurse -Filter *.java | ForEach-Object { $_.FullName }

New-Item -ItemType Directory -Force -Path $OUT | Out-Null

if (Get-Command javac -ErrorAction SilentlyContinue) {
  Write-Host "[build] using javac: $(javac -version 2>&1)"
  & javac -encoding UTF-8 -cp "$LIB/*" -d $OUT $SOURCES
} else {
  Write-Host "[build] javac not found -> compiling with Janino (JRE only): $(java -version 2>&1 | Select-Object -First 1)"
  & java -cp "$LIB/janino-3.1.9.jar;$LIB/commons-compiler-3.1.9.jar" `
    org.codehaus.janino.SimpleCompiler backend/tools/Build.java Build $OUT $LIB @SOURCES
}

if ($LASTEXITCODE -ne 0) { throw "[build] compilation failed" }
Write-Host "[build] compiled -> $OUT"
