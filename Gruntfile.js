function setup(grunt) {
  grunt.initConfig({
    favicons: {
      icons: {
        src: 'src/img/restaurant.png',
        dest: 'dist/img/favicon',
      },
    },
    responsive_images: {
      restaurant_images: {
        options: {
          engine: 'im',
          sizes: [
            { width: 800, quality: 60, suffix: '_large' }, // 800px is the maximum width
            { width: 800, quality: 60, suffix: '_medium_2x' },
            { width: 600, quality: 60, suffix: '_medium_1x' },
            { width: 800, quality: 60, suffix: '_small_2x' },
            { width: 400, quality: 60, suffix: '_small_1x' },
          ],
        },
        files: [{
          expand: true,
          src: ['*.jpg'],
          cwd: 'src/img/',
          dest: 'dist/img/',
        }],
      },
      icons: {
        options: {
          engine: 'im',
          sizes: [
            { width: 512, quality: 100 },
            { width: 192, quality: 100 },
          ],
        },
        files: [{
          expand: true,
          src: ['restaurant.png'],
          cwd: 'src/img/',
          dest: 'dist/img/icons',
        }],
      },
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['img'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['dist', 'dist/img', 'dist/img/favicon', 'dist/img/icons'],
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-favicons');
  grunt.registerTask('default', ['clean', 'mkdir', 'responsive_images']);
}

module.exports = setup;
