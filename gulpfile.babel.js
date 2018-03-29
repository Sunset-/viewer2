import fs from 'fs';
import gulp from 'gulp';
import gutil from 'gulp-util';
import minifyhtml from 'gulp-minify-html';
import imagemin from 'gulp-imagemin';
import minifycss from 'gulp-minify-css';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import concat from 'gulp-concat';
import clean from 'gulp-clean';
import rev from 'gulp-rev';
import revCollector from 'gulp-rev-collector';
import runSequence from 'gulp-run-sequence';
import zip from 'gulp-zip';
import moment from 'moment';
import webpack from "webpack";
import webpackConfig from "./webpack.config.js";
import BrowserSync from 'browser-sync';
import watch from 'gulp-watch';
import path from 'path';
import watchPath from 'gulp-watch-path';
import combiner from 'stream-combiner2';
import proxy from 'http-proxy-middleware';

var sourceDir = 'src';
var buildDir = 'eagleeyes';
var buildZip = `${buildDir}.${moment().format('YYYYMMDD')}.zip`;


//clean
var deleteFolderRecursive = (path) => {
  var files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file, index) => {
      var curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

gulp.task('clean', () => {
  return deleteFolderRecursive(`./${buildDir}`);
});

//vendor
gulp.task('vendor', () => {
  return gulp.src(`${sourceDir}/ext/**/*`).pipe(gulp.dest(`${buildDir}/ext`));
});

//html
gulp.task('html', () => {
  return gulp.src(`${sourceDir}/**/*.html`).pipe(minifyhtml()).pipe(gulp.dest(buildDir));
});

//css
gulp.task('css', () => {
  return gulp.src(`${sourceDir}/css/**/*.css`).pipe(minifycss()).pipe(gulp.dest(`${buildDir}/css`));
});


//image
gulp.task('image', () => {
  return gulp.src([`${sourceDir}/images/**/*.png`,
      `${sourceDir}/assets/**/*.jpg`,
      `${sourceDir}/assets/**/*.gif`,
      `${sourceDir}/*.ico`,
    ])
    .pipe(imagemin())
    .pipe(gulp.dest(`${buildDir}/images`));
});

//webpack
gulp.task("webpack", (callback) => {
  var myConfig = Object.create(webpackConfig);
  webpack(
    myConfig,
    function (err, stats) {
      if (err) throw new gutil.PluginError("webpack", err);
      gutil.log("[webpack]", stats.toString({
        // output options
      }));
      callback();
    });
});


//web
var browserSync = BrowserSync.create();
gulp.task('browser-sync', () => {
  var files = ['eagleeyes/**/*.*'];
  //static
  browserSync.init(files, {
    server: {
      baseDir: './',
      init: 'eagleeyes/eagleeyes.html',
      middleware: [
        proxy('/business/', {
          target: "http://192.168.0.143:8080/",
          // target: "http://www.peaimage.com/",
          changeOrigin: true
        }),
        proxy('/image-service/', {
          target: "http://192.168.0.171:9120/",
          pathRewrite: {
              '^/image-service': ''
          },
          // target: "http://www.peaimage.com/",
          changeOrigin: true
        }),
        proxy('/upload/', {
          target: "http://192.168.0.171:8082/",
          pathRewrite: {
              '^/upload': ''
          },
          // target: "http://www.peaimage.com/",
          changeOrigin: true
        })
      ]
    }

  });
  //proxy
  // browserSync.init(files, {
  //   port : '4000',
  //   // proxy: 'localhost:15000/',
  // });
});

//watch//,
gulp.task('watch', ['browser-sync'], (callback) => {
  //gulp.watch(`${sourceDir}/**/*.scss`, ['sass']);
  gulp.watch(`${sourceDir}/**/*.js`, ['webpack']);
  gulp.watch(`${sourceDir}/**/*.html`, (event) => {
    var paths = watchPath(event, sourceDir, buildDir);
    /*
    paths
        srcPath: 'src/file.js',
        distDir: 'dist/'
    */
    var combined = combiner.obj([
      gulp.src(paths.srcPath),
      minifyhtml(), // src/file.js
      gulp.dest(paths.distDir), // dist/
    ]);
    combined.on('error', function (err) {
      console.log('--------------');
      console.log('Error');
      console.log('fileName: ' + err.fileName);
      console.log('lineNumber: ' + err.lineNumber);
      console.log('message: ' + err.message);
      console.log('plugin: ' + err.plugin);
    });

    console.log('\n');
    console.log(event.type + ': ' + paths.srcPath);
    console.log('dist: ' + paths.distPath);
    /*
    changed: src/file.js
    dist: dist/file.js
    */
  });
  gulp.watch(`${sourceDir}/css/**/*.css`, (event) => {
    var paths = watchPath(event, sourceDir, buildDir);
    var combined = combiner.obj([
      gulp.src(paths.srcPath),
      minifyhtml(), // src/file.js
      gulp.dest(paths.distDir), // dist/
    ]);
    combined.on('error', function (err) {
      console.log('--------------');
      console.log('Error');
      console.log('fileName: ' + err.fileName);
      console.log('lineNumber: ' + err.lineNumber);
      console.log('message: ' + err.message);
      console.log('plugin: ' + err.plugin);
    });

    console.log('\n');
    console.log(event.type + ': ' + paths.srcPath);
    console.log('dist: ' + paths.distPath);
  });
  callback();
});

//zip
gulp.task('zip', function () {
  gulp.src([buildDir + '*/**/*'])
    .pipe(zip(buildZip))
    .pipe(gulp.dest('build'));
});

gulp.task('default', function () {
  runSequence('clean', 'vendor', 'html', 'css', 'image', 'webpack', 'watch');
});

gulp.task('build', ['clean', 'vendor', 'html', 'css', 'image', 'webpack'], function () {
  runSequence('zip');
});