import java.io.File;
import java.io.FilenameFilter;
import java.util.Arrays;
import java.util.Comparator;

import org.codehaus.janino.Compiler;

/**
 * Build driver — compiles the backend sources with Janino.
 *
 * The sandbox JRE has no javac, so backend/scripts/build.sh launches this
 * class through Janino's SimpleCompiler ("runs a .java file from the command
 * line, like a script"); the running Build then compiles every backend source
 * into backend/out/classes using the Janino compiler API.
 *
 * Usage:
 *   java -cp janino-3.1.9.jar:commons-compiler-3.1.9.jar \
 *        org.codehaus.janino.SimpleCompiler backend/tools/Build.java Build \
 *        <dest-dir> <lib-dir> <source-file>...
 */
public class Build {

    /** Raw Comparator (Janino generates no bridge methods for generic anonymous classes). */
    private static final Comparator BY_NAME = new Comparator() {
        public int compare(Object a, Object b) {
            return ((File) a).getName().compareTo(((File) b).getName());
        }
    };

    public static void main(String[] args) throws Exception {
        if (args.length < 3) {
            System.err.println("Usage: Build <dest-dir> <lib-dir> <source-file>...");
            System.exit(1);
        }

        File destDir = new File(args[0]);
        File libDir = new File(args[1]);

        File[] classPath = libDir.listFiles(new FilenameFilter() {
            public boolean accept(File dir, String name) {
                return name.endsWith(".jar");
            }
        });
        if (classPath == null) classPath = new File[0];
        Arrays.sort(classPath, BY_NAME);

        if (!destDir.isDirectory() && !destDir.mkdirs()) {
            System.err.println("Cannot create destination directory " + destDir);
            System.exit(1);
        }

        File[] sources = new File[args.length - 2];
        for (int i = 2; i < args.length; i++) {
            sources[i - 2] = new File(args[i]);
        }

        Compiler compiler = new Compiler();
        compiler.setClassPath(classPath);
        compiler.setDestinationDirectory(destDir, false);
        compiler.setCharacterEncoding("UTF-8");
        compiler.setDebugLines(true);

        boolean ok = compiler.compile(sources);
        if (!ok) {
            System.err.println("[build] compilation failed");
            System.exit(1);
        }
        System.out.println("[build] compiled " + sources.length + " source files -> " + destDir);
    }
}
