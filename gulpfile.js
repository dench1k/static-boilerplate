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
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const gradient = require('gradient-string');

// CONSTANTS
const SRC_DIR = "src";
const BUILD_DIR = "build";
const FONTS_DIR = "fonts";
const SASS_DIR = "sass";
const CSS_DIR = "css";
const JS_DIR = "js";
const IMG_DIR = "images";
const ICONS_DIR = "icons";

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
  return src(`${SRC_DIR}/*.html`)
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
    .pipe(dest(BUILD_DIR));
}

function fonts() {
  return src(`${SRC_DIR}/${FONTS_DIR}/*`).pipe(
    dest(`${BUILD_DIR}/${FONTS_DIR}`)
  );
}

function styles() {
  return src(`${SRC_DIR}/${SASS_DIR}/styles.scss`, {
    sourcemaps: true,
  })
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss(processors))
    .pipe(rename({ suffix: ".min" }))
    .pipe(dest(`${BUILD_DIR}/${CSS_DIR}`, { sourcemaps: "." }));
}

function scripts() {
  return src([
    `${SRC_DIR}/${JS_DIR}/lib/*.js`,
    `${SRC_DIR}/${JS_DIR}/plugins/*.js`,
    `${SRC_DIR}/${JS_DIR}/*.js`
  ], { sourcemaps: true })
    .pipe(plumber())
    .pipe(concat("app.min.js"))
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(terser())
    .pipe(dest(`${BUILD_DIR}/${JS_DIR}`, { sourcemaps: "." }));
}

function images() {
  return src(`${SRC_DIR}/${IMG_DIR}/**/*`, { since: lastRun(images) })
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
    .pipe(dest(`${BUILD_DIR}/${IMG_DIR}`));
}

function revision() {
  return src(`${BUILD_DIR}/**/*.{css,js}`)
    .pipe(rev())
    .pipe(dest(BUILD_DIR))
    .pipe(rev.manifest())
    .pipe(dest(BUILD_DIR));
}

function rewrite() {
  const manifest = src(`${BUILD_DIR}/rev-manifest.json`);

  return src(`${BUILD_DIR}/**/*.html`)
    .pipe(revRewrite({ manifest }))
    .pipe(dest(BUILD_DIR));
}

function sprite() {
  return src(
    `${SRC_DIR}/${IMG_DIR}/${ICONS_DIR}/{icon-*,logo-*}.svg`
  )
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename(`sprite_auto.svg`))
    .pipe(dest(`${BUILD_DIR}/${IMG_DIR}/${ICONS_DIR}`));
}

function webp() {
  return src(`${BUILD_DIR}/${IMG_DIR}/**/*.{png,jpg}`)
    .pipe(webpPlugin({ quality: 85 }))
    .pipe(dest(`${BUILD_DIR}/${IMG_DIR}`));
}

function clean() {
  return del(BUILD_DIR);
}

function refresh(cb) {
  server.reload();
  cb();
}

function serve(cb) {
  server.init({
    server: `${BUILD_DIR}/`,
    browser: "chrome",
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });
  watch(
    `${SRC_DIR}/${IMG_DIR}/**/*.{gif,png,jpg,jpeg,svg,webp}`,
    series(images, refresh)
  );
  watch(
    `${SRC_DIR}/${SASS_DIR}/**/*.{scss,sass,css}`,
    series(styles, refresh)
  );
  watch(`${SRC_DIR}/${JS_DIR}/**/*.js`, series(scripts, refresh));
  watch(`${SRC_DIR}/**/*.html`, series(html, refresh));
  cb();
  // eslint-disable-next-line no-console
  console.log(gradient.rainbow.multiline([
    "    .^====^.   ",
    "   =( ^--^ )=  ",
    "    /       \\ /~   ฅ^•ﻌ•^ฅ BUILD IS FINISHED [^._.^]ﾉ彡",
    "  +( |    | )/"
  ].join('\n')));
}

const dev = parallel(html, styles, scripts, fonts, images);
const build = series(clean, dev, revision, rewrite);

exports.html = html;
exports.fonts = fonts;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.revision = revision;
exports.rewrite = rewrite;
exports.sprite = sprite;
exports.webp = webp;
exports.clean = clean;
exports.serve = serve;

exports.default = series(setMode(), build, serve);
exports.start = series(setMode(), build, serve);
exports.build = series(setMode(true), build);
