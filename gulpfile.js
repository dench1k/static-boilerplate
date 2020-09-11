const { watch, series, parallel, src, dest, lastRun } = require("gulp");
const plumber = require("gulp-plumber");
const sass = require("gulp-sass");
const concat = require("gulp-concat");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const flexbugs = require("postcss-flexbugs-fixes");
const cssnano = require("cssnano");
const rename = require("gulp-rename");
const babel = require("gulp-babel");
const terser = require("gulp-terser");
const imagemin = require("gulp-imagemin");
const webpPlugin = require("gulp-webp");
const svgstore = require("gulp-svgstore");
const del = require("del");
const server = require("browser-sync").create();
const fileinclude = require("gulp-file-include");

/**
 * considering set of plugins
 */
// const gulpif = require('gulp-if');

// CONSTANTS
const SRC_DIR_NAME = "src";
const BUILD_DIR_NAME = "build";
const FONTS_DIR_NAME = "fonts";
const SASS_DIR_NAME = "sass";
const CSS_DIR_NAME = "css";
const JS_DIR_NAME = "js";
const IMG_DIR_NAME = "images";
const ICONS_DIR_NAME = "icons";

const processors = [
  autoprefixer({
    grid: true,
  }),
  flexbugs(),
  cssnano(),
];

function setMode(isProduction = false) {
  return (cb) => {
    process.env.NODE_ENV = isProduction ? "production" : "development";
    cb();
  };
}

function html() {
  return src(`${SRC_DIR_NAME}/*.html`)
    .pipe(plumber())
    .pipe(
      fileinclude({
        prefix: `@@`,
        basepath: `@root`,
        context: {
          // global variables for include
          test: `text`,
        },
      })
    )
    .pipe(dest(BUILD_DIR_NAME));
}

function fonts() {
  return src(`${SRC_DIR_NAME}/${FONTS_DIR_NAME}/*`).pipe(
    dest(`${BUILD_DIR_NAME}/${FONTS_DIR_NAME}`)
  );
}

function styles() {
  return src(`${SRC_DIR_NAME}/${SASS_DIR_NAME}/styles.scss`, {
    sourcemaps: true,
  })
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss(processors))
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest(`${BUILD_DIR_NAME}/${CSS_DIR_NAME}`, { sourcemaps: "." }));
}

function scripts() {
  return src(`${SRC_DIR_NAME}/${JS_DIR_NAME}/**/*.js`, { sourcemaps: true })
    .pipe(plumber())
    .pipe(concat("app.min.js"))
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(terser())
    .pipe(dest(`${BUILD_DIR_NAME}/${JS_DIR_NAME}`, { sourcemaps: "." }));
}

function images() {
  return src(`${SRC_DIR_NAME}/${IMG_DIR_NAME}/**/*`, { since: lastRun(images) })
    .pipe(plumber())
    .pipe(
      imagemin(
        [
          imagemin.gifsicle({ interlaced: true }),
          imagemin.mozjpeg({
            quality: 75,
            progressive: true,
          }),
          imagemin.optipng({ optimizationLevel: 3 }),
          imagemin.svgo({
            plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
          }),
        ],
        {
          verbose: true,
        }
      )
    )
    .pipe(dest(`${BUILD_DIR_NAME}/${IMG_DIR_NAME}`));
}

// TODO: make automated
function sprite() {
  return src(
    `${SRC_DIR_NAME}/${IMG_DIR_NAME}/${ICONS_DIR_NAME}/{icon-*,logo-*}.svg`
  )
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename(`sprite_auto.svg`))
    .pipe(dest(`${BUILD_DIR_NAME}/${IMG_DIR_NAME}/${ICONS_DIR_NAME}`));
}

// TODO: make automated
function webp() {
  return src(`${BUILD_DIR_NAME}/${IMG_DIR_NAME}/**/*.{png,jpg}`)
    .pipe(webpPlugin({ quality: 85 }))
    .pipe(dest(`${BUILD_DIR_NAME}/${IMG_DIR_NAME}`));
}

function clean() {
  return del(BUILD_DIR_NAME);
}

function refresh(cb) {
  server.reload();
  cb();
}

function serve(cb) {
  server.init({
    server: `${BUILD_DIR_NAME}/`,
    browser: "chrome",
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });
  watch(
    `${SRC_DIR_NAME}/${IMG_DIR_NAME}/**/*.{gif,png,jpg,jpeg,svg,webp}`,
    series(images, refresh)
  );
  watch(
    `${SRC_DIR_NAME}/${SASS_DIR_NAME}/**/*.{scss,sass,css}`,
    series(styles, refresh)
  );
  watch(`${SRC_DIR_NAME}/${JS_DIR_NAME}/**/*.js`, series(scripts, refresh));
  watch(`${SRC_DIR_NAME}/**/*.html`, series(html, refresh));
  cb();
}

const dev = parallel(html, styles, scripts, fonts, images);
const build = series(clean, dev);

exports.html = html;
exports.fonts = fonts;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.sprite = sprite;
exports.webp = webp;
exports.clean = clean;
exports.serve = serve;

exports.default = series(setMode(), build, serve);
exports.start = series(setMode(), build, serve);
exports.build = series(setMode(true), build);
