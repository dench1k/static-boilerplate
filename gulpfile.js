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
const del = require('del');
const server = require('browser-sync').create();
/**
 * considering set of plugins
 */
// const gulpif = require('gulp-if');

function setMode(isProduction = false) {
  return cb => {
    process.env.NODE_ENV = isProduction ? 'production' : 'development'
    cb()
  }
}

function html() {
  return src('src/html/*.html')
    .pipe(plumber())
    .pipe(dest('build'))
}

function fonts() {
  return src('src/fonts/*')
    .pipe(dest('build/fonts'))
}

function styles() {
  return src('src/sass/*.{scss, sass}')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer({
      cascade: false
    }))
    /*.pipe(shorthand())*/
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
    .pipe(plumber())
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
  console.log('clean');
  return del('build').then(() => {
    cb();
  });
}

function readyReload(cb) {
  server.reload();
  cb();
}

function serve(cb) {
  server.init({
    server: 'build',
    browser: "chrome",
    notify: false,
    open: true,
    cors: true
  })
  watch('src/images/**/*.{gif,png,jpg,svg,webp}', series(images, readyReload))
  watch('src/sass/**/*.scss', series(styles, cb => src('build/css').pipe(server.stream()).on('end', cb)))
  watch('src/js/**/*.js', series(scripts, readyReload))
  watch('src/html/**/*.html', series(html, readyReload))
  return cb();
}

const dev = parallel(html, styles, scripts, fonts, images);
const build = series(clean, dev);


exports.build = build;
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