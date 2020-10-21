const projectFolder = "dist",
  sourceFolder = "src",
  fs = require("fs");

const path = {
  build: {
    html: projectFolder + "/",
    css: projectFolder + "/assets/css/",
    js: projectFolder + "/js/",
    img: projectFolder + "/assets/img/",
    icons: projectFolder + "/assets/icons/",
    fonts: projectFolder + "/assets/fonts/",
  },
  src: {
    html: [sourceFolder + "/*.html", "!" + sourceFolder + "/_*.html"],
    css: sourceFolder + "/assets/scss/styles.scss",
    js: sourceFolder + "/js/**/*.js",
    img: sourceFolder + "/assets/img/**/*.{jpg, png, svg, gif, ico, webp}",
    icons: sourceFolder + "/assets/icons/**/*.svg",
    fonts: sourceFolder + "/assets/fonts/*.ttf",
  },
  watch: {
    html: sourceFolder + "/**/*.html",
    css: sourceFolder + "/assets/scss/**/*.scss",
    js: sourceFolder + "/js/**/*.js",
    icons: sourceFolder + "/assets/icons/**/*.svg",
    img: sourceFolder + "/assets/img/**/*.{jpg, png, svg, gif, ico, webp}",
  },
  clean: "./" + projectFolder + "/",
};

const {
  src,
  dest
} = require("gulp"),
  gulp = require("gulp"),
  browsersync = require("browser-sync").create(),
  fileinclude = require("gulp-file-include"),
  del = require("del"),
  scss = require("gulp-sass"),
  autoprefixer = require("gulp-autoprefixer"),
  groupMedia = require("gulp-group-css-media-queries"),
  cleanCSS = require("gulp-clean-css"),
  rename = require("gulp-rename"),
  imagemin = require("gulp-imagemin"),
  uglify = require("gulp-uglify-es").default,
  webp = require("gulp-webp"),
  webpHTML = require("gulp-webp-html"),
  webpcss = require("gulp-webpcss"),
  svgSprite = require("gulp-svg-sprite"),
  ttf2woff = require("gulp-ttf2woff"),
  ttf2woff2 = require("gulp-ttf2woff2"),
  fonter = require("gulp-fonter"),
  babel = require("gulp-babel"),
  concat = require("gulp-concat");

function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: "./" + projectFolder + "/",
    },
    port: 3000,
    notify: false,
  });
}

function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webpHTML())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: "expanded",
      })
    )
    .pipe(groupMedia())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 versions"],
        cascade: true,
      })
    )
    .pipe(webpcss({}))
    .pipe(dest(path.build.css))
    .pipe(cleanCSS())
    .pipe(
      rename({
        extname: ".min.css",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(concat("script.js"))
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(concat("script.js"))
    .pipe(
      rename({
        extname: ".min.js",
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream());
}

function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{
          removeViewBox: false,
        }, ],
        interlaced: true,
        optimizationLevel: 3, // 0 to 7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream());
}

function icons() {
  return src(path.src.icons)
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{
          removeViewBox: false,
        }, ],
        interlaced: true,
        optimizationLevel: 3, // 0 to 7
      })
    )
    .pipe(dest(path.build.icons))
    .pipe(browsersync.stream());
}

function fonts(params) {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));

  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

// call the command "gulp otf2ttf" in terminal to convert .otf fonts into .ttf in SRC FOLDER and than you can run 'gulp' command

// if it doesn`t work:
//        открываем node_modules/gulp-fonter/dist/index.js, находим строку:
//        newFont.path = source.dirname + '\\' + source.stem + '.' + type;
//        , меняем '\\' на '/', и должно заработать.

gulp.task("otf2ttf", function () {
  return src([sourceFolder + "/assets/fonts/*.otf"])
    .pipe(
      fonter({
        formats: ["ttf"],
      })
    )
    .pipe(dest(sourceFolder + "/assets/fonts/"));
});

// to create icons sprite you need create folder 'iconsprite', add iconts there and call the command "gulp" and than "gulp svgSprite" in other terminal

gulp.task("svgSprite", function () {
  return gulp
    .src([sourceFolder + "/assets/iconsprite/*.svg"])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../icons/icons.svg", // sprite file name
            example: true,
          },
        },
      })
    )
    .pipe(dest(path.build.img));
});

// REMEMBER
// DON'T forget to change font-name and font-weight
// look to example below

// @include font("Lato-Thin", "Lato-Thin", "400", "normal");
// @include font("Lato-Regular", "Lato-Regular", "400", "normal");

// @include font("Lato", "Lato-Thin", "100", "normal");
// @include font("Lato", "Lato-Regular", "400", "normal");

function fontsStyle(params) {
  const file_content = fs.readFileSync(
    sourceFolder + "/assets/scss/utils/_fonts.scss"
  );
  if (file_content == "") {
    fs.writeFile(sourceFolder + "/assets/scss/utils/_fonts.scss", "", cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let cFontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (cFontname != fontname) {
            fs.appendFile(
              sourceFolder + "/assets/scss/utils/_fonts.scss",
              '@include font("' +
              fontname +
              '", "' +
              fontname +
              '", "400", "normal");\r\n',
              cb
            );
          }
          cFontname = fontname;
        }
      }
    });
  }
}

function cb() {}

function watchFiles(params) {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
  gulp.watch([path.watch.icons], icons);
}

function clean(params) {
  return del(path.clean);
}

const build = gulp.series(
    clean,
    gulp.parallel(js, css, html, images, icons, fonts),
    fontsStyle
  ),
  watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.icons = icons;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;