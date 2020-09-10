const {watch, series, parallel, src, dest, lastRun} = require("gulp");
const plumber = require("gulp-plumber");
const sass = require("gulp-sass");
const concat = require('gulp-concat');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const flexbugs = require('postcss-flexbugs-fixes');
const minmax = require('postcss-media-minmax');
const cssnano = require('cssnano');
const rename = require("gulp-rename");
const babel = require('gulp-babel');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgstore = require('gulp-svgstore');
const del = require('del');
const server = require('browser-sync').create();

/**
 * considering set of plugins
 */
// const gulpif = require('gulp-if');

const processors = [minmax(),
  autoprefixer(),
  flexbugs(), cssnano];

function setMode(isProduction = false) {
  return cb => {
    process.env.NODE_ENV = isProduction ? 'production' : 'development'
    cb()
  }
}

function html() {
  return src('src/*.html')
    .pipe(plumber())
    .pipe(dest('build'))
}

function fonts() {
  return src('src/fonts/*')
    .pipe(dest('build/fonts'))
}

function styles() {
  return src('src/sass/styles.scss', {sourcemaps: true})
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss(processors))
    .pipe(rename({suffix: '.min'}))
    .pipe(dest('build/css', {sourcemaps: "."}))
}

function scripts() {
  return src('src/js/**/*.js', {sourcemaps: true})
    .pipe(plumber())
    .pipe(concat('app.min.js'))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(terser())
    .pipe(dest('build/js', {sourcemaps: "."}))
}

function images() {
  return src('src/images/**/*', {since: lastRun(images)})
    .pipe(plumber())
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({
        quality: 75,
        progressive: true
      }),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ], {
      verbose: true
    }))
    .pipe(dest('build/images'));
}

function clean() {
  return del('build');
}

function refresh(cb) {
  server.reload();
  cb();
}

function serve(cb) {
  server.init({
    server: 'build/',
    browser: "chrome",
    notify: false,
    open: true,
    cors: true,
    ui: false
  })
  watch('src/images/**/*.{gif,png,jpg,jpeg,svg,webp}', series(images, refresh));
  watch('src/sass/**/*.{scss,sass,css}', series(styles, refresh));
  watch('src/js/**/*.js', series(scripts, refresh));
  watch('src/*.html', series(html, refresh));
  cb();
}

const dev = parallel(html, styles, scripts, fonts, images);
const build = series(clean, dev);

exports.html = html;
exports.fonts = fonts;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.clean = clean;
exports.serve = serve;

exports.default = series(setMode(), build, serve);
exports.start = series(setMode(), build, serve);
exports.build = series(setMode(true), build);