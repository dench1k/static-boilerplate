const {watch, series, parallel, src, dest} = require("gulp");
const plumber = require("gulp-plumber");
const sass = require("gulp-sass");
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const shorthand = require('gulp-shorthand');
const autoprefixer = require('gulp-autoprefixer');
const rename = require("gulp-rename");
/**
 * considering set of plugins
 */
// const babel = require('gulp-babel');
// const uglify = require('gulp-uglify');
// const rename = require('gulp-rename');
// const del = require('delete');
// const gulpif = require('gulp-if');

function html() {
  return src('src/html/*.html')
    .pipe(plumber())
    .pipe(dest('build'))
}

function styles() {
  return src('src/sass/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(shorthand())
    .pipe(cleanCSS({
      debug: true,
      compatibility: '*'
    }, details => {
      console.log(`${details.name}: Original size:${details.stats.originalSize} - Minified size: ${details.stats.minifiedSize}`)
    }))
    .pipe(sourcemaps.write())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('build/css'))
}

function clean(cb) {
  cb();
}

function build(cb) {
  cb();
}

exports.build = build;
exports.html = html;
exports.styles = styles;
exports.default = series(clean, build);