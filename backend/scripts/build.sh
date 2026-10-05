#!/usr/bin/env bash
#
# Compiles the Java servlet backend into backend/out/classes.
#
# A plain JRE is enough: this script bootstraps the Janino compiler
# (backend/tools/Build.java) and uses it to compile the backend sources
# against the libraries in backend/lib. Set JAVA_HOME to use a specific java.
#
set -euo pipefail
cd "$(dirname "$0")/../.."   # repository root

BIN="${JAVA_HOME:+$JAVA_HOME/bin/}java"
LIB="backend/lib"
OUT="backend/out/classes"

echo "[build] using $("$BIN" -version 2>&1 | head -1)"

# shellcheck disable=SC2046
"$BIN" \
  -cp "$LIB/janino-3.1.9.jar:$LIB/commons-compiler-3.1.9.jar" \
  org.codehaus.janino.SimpleCompiler \
  backend/tools/Build.java Build \
  "$OUT" "$LIB" \
  $(find backend/src/main/java -name '*.java')
