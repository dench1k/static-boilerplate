const {watch, series, parallel, src, dest} = require("gulp");
const plumber = require("gulp-plumber");
const sass = require("gulp-sass");
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const shorthand = require('gulp-shorthand');
const autoprefixer = require('gulp-autoprefixer');
const rename = require("gulp-rename");
const babel = require('gulp-babel');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin')
/**
 * considering set of plugins
 */

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
  return src('src/sass/*.{scss, sass}')
    .pipe(plumber())
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

function scripts(cb) {
  src('src/js/app.js')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(terser())
    .pipe(sourcemaps.write())
    .pipe(rename({suffix: '.min'}))
    .pipe(dest('build/js'))
  return cb()
}

function images() {
  return src('src/images/*.{gif,png,jpg,jpeg,svg,webp}')
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.mozjpeg({
        quality: 75,
        progressive: true
      }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(dest('build/images'))
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
exports.scripts = scripts;
exports.images = images;
exports.default = series(clean, build);