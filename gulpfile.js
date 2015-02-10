
var gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    browserify = require('browserify'),
    sourcemaps = require('gulp-sourcemaps'),
    watchify = require('watchify'),
    sass = require('gulp-sass');

watchify.args.debug = true;

gulp.task('build', function() {

    browserify('./extension/js/main.js')
        .bundle()
        .pipe(source('bundled/popup.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./extension/js'));

    browserify('./extension/js/options.js')
        .bundle()
        .pipe(source('bundled/options.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./extension/js'));

});

gulp.task('sass', function() {
    return gulp.src('./extension/styles/sass/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./extension/styles/built'));
});

gulp.task('watch', function(cb) {

    function watch(src, dst) {

        var bundler = watchify(browserify(watchify.args)).add('./extension/js/' + src);
        
        function bundle() {
            console.log("Bundling " + dst);
            
            return bundler.bundle()
                .pipe(source(dst))
                .pipe(buffer())
                .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest('./extension/js/'));
        }

        bundler.on('update', bundle);
        
        return bundle;
    }

    gulp.watch('./extension/styles/sass/*.scss', ['sass']);

    watch('main.js', 'bundled/popup.js')();
    return watch('options.js', 'bundled/options.js')();
});
