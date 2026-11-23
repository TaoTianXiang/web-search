const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack(config) {
    // 以字符串形式引入 Markdown 教材内容
    config.module
      .rule('markdown')
      .test(/\.md$/)
      .type('asset/source')

    // 运行时单独抽出，保证长期缓存稳定
    config.optimization.runtimeChunk('single')
  }
})