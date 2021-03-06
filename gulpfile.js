
var gulp = require("gulp");
var gutil = require("gulp-util");
var pump = require("pump");
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var jeditor = require("gulp-json-editor");
var tslint = require("gulp-tslint");
var del = require("del");
var path = require("path");
var cp = require("child_process");

// Helper
function spawn(command, args, done) {

    const child = cp.spawn(command, args, {
        cwd: __dirname
    });

    child.stdout.on("data", (data) => {
        gutil.log(data.toString().trim());
    });

    child.stderr.on("data", (data) => {
        gutil.log(gutil.colors.red(data.toString().trim()));
    });

    child.on("error", (error) => {
        gutil.log(gutil.colors.red(error));
    });

    child.on("exit", (code) => {
        if (code === 0) {
            done();
        } else {
            done(code);
        }
    });
}

// Tasks
gulp.task("lint", (done) => {
    pump([
        gulp.src(["./src/*.ts", "./src/**/*.ts", "./test/**/*.ts", "./test/*.ts"]),
        tslint(),
        tslint.report()
    ], done);
});

gulp.task("compile", (done) => {
    const tsProject = ts.createProject("./tsconfig.json");
    pump([
        tsProject.src(),
        sourcemaps.init(),
        tsProject(),
        sourcemaps.write(".", {
            mapSources: (sourcePath, file) => {
                // Correct source map path.
                const relativeSourcePath = path.relative(path.dirname(file.path), path.join(file.base, sourcePath));
                return relativeSourcePath;
            }
        }),
        gulp.dest("out")
    ], done);
});

gulp.task("test", (done) => {
    spawn("node", ["./node_modules/vscode/bin/test"], done);
});

gulp.task('cover:enable', (done) => {
    pump([
        gulp.src("./coverconfig.json"),
        jeditor(function(json) {
            json.enabled = true;
            return json; // must return JSON object.
        }),
        gulp.dest("./", {'overwrite':true})
    ], done);
});

gulp.task('cover:disable', (done) => {
    pump([
        gulp.src("./coverconfig.json"),
        jeditor(function(json) {
        json.enabled = false;
        return json; // must return JSON object.
        }),
        gulp.dest("./", {'overwrite':true})
    ], done);
});

gulp.task("clean", (done) => {
    return del(['out', 'coverage'], done);
});

gulp.task("build", gulp.series("clean", "compile"));

gulp.task("watch", () => {
    gulp.watch(["./src/*.ts", "./src/**/*.ts", "./test/**/*.ts", "./test/*.ts"], gulp.series("compile"));
});