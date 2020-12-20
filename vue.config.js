const path = require('path')

module.exports = {
  publicPath: './',
  devServer: {
    overlay: {
      warnings: false,
      errors: false
    },
    clientLogLevel: 'warning'
  },
  configureWebpack: {
    resolve: {
      alias: {
        src: path.join(__dirname, 'src'),
        styles: path.join(__dirname, 'src/assets/styles')
      }
    }
  }
}
