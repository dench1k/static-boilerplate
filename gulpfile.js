const {watch, series, parallel} = require("gulp");
/**
 * considering set of plugins
 */
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const del = require('delete');
const gulpif = require('gulp-if');

function clean(cb) {
  cb();
}

function build(cb) {
  cb();
}

exports.build = build;
exports.default = series(clean, build);