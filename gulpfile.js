/**
 * Copyright 2015-2016, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-env node */
/* eslint-no-console: 0 */
const gulp = require('gulp');
const serve = require('gulp-serve');
const swPrecache = require('sw-precache');
const path = require('path');
const htmlmin = require('gulp-htmlmin');
const runSequence = require('run-sequence');
const rev = require('gulp-rev');
const revReplace = require('gulp-rev-replace');
const revdel = require('gulp-rev-delete-original');
const useref = require('gulp-useref');
const filter = require('gulp-filter');
const del = require('del');
const eslint = require('gulp-eslint');
const webpackStream = require('webpack-stream');
const webpack2 = require('webpack');

gulp.task('default', () => {
  console.log('Default Task!');
});

gulp.task('generate-service-worker', callback => {
  const rootDir = 'dist';
  swPrecache.write(path.join(rootDir, 'service-worker.js'), {
    staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
    stripPrefix: rootDir
  }, callback);
});

gulp.task('clean', () => {
  return del('dist');
});

gulp.task('webpack', () => {
  return gulp.src('./src/js/app.js')
    .pipe(webpackStream({
      devtool: 'source-map',
      output: {
        filename: 'app.js'
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['es2015']
              }
            }
          }
        ]
      },
      plugins: [
        new webpack2.optimize.UglifyJsPlugin({minimize: true, sourceMap: true})
      ]
    }, webpack2))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('minify', () => {
  return gulp.src('src/**/*.html')
    .pipe(htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeEmptyAttributes: true,
      minifyJS: true,
      minifyCSS: true
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('eslint', () => {
  return gulp.src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format());
});
/**
 * Creates file revisions
 */
gulp.task('rev', () => {
  const jsFilter = filter(['dist/js/*.js'], {restore: true});
  const indexFilter = filter(['dist/index.html'], {restore: true});
  return gulp.src(['dist/**/*.*'])
    .pipe(useref())
    .pipe(jsFilter)
    .pipe(rev())
    .pipe(revdel())
    .pipe(gulp.dest('dist'))
    .pipe(jsFilter.restore)
    .pipe(revReplace())
    .pipe(indexFilter)
    .pipe(gulp.dest('dist'));
});

gulp.task('static', () => {
  return gulp.src(['src/**/*.*', '!src/**/*.js', '!src/**/*.html'])
    .pipe(gulp.dest('dist'));
});

gulp.task('deploy', () => {

});

gulp.task('build', () => {
  runSequence(
    'clean',
    ['rollup', 'static', 'minify'],
     'generate-service-worker');
});

gulp.task('dist', () => {
  runSequence(
    'eslint',
    'clean',
    ['webpack', 'static', 'minify'],
     'rev',
     'generate-service-worker');
});

gulp.task('serve', ['build'], serve('dist/'));
