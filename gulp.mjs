import gulp from 'gulp';
import gzip from 'gulp-gzip';
import brotli from 'gulp-brotli';

gulp.task('install-wasm', () => {
  return gulp.src('./node_modules/brotli-wasm/pkg.web/*.wasm')
    .pipe(gulp.dest('./src'));
});

gulp.task('compress-gzip', () => {
  return gulp.src(['./dist/**/*.*'])
    .pipe(gzip())
    .pipe(gulp.dest('./dist'));
});

gulp.task('compress-brotli', () => {
  return gulp.src(['./dist/**/*.*'])
    .pipe(brotli())
    .pipe(gulp.dest('./dist'));
});
