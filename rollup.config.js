import localResolve from 'rollup-plugin-local-resolve'
import nodeResolve from 'rollup-plugin-node-resolve'
import buble from 'rollup-plugin-buble'

export default [
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs'
    },
    plugins: [
      localResolve()
    ]
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/browser.js',
      format: 'iife',
      name: 'stx',
      sourcemap: 'inline'
    },
    plugins: [
      nodeResolve({ browser: true }),
      buble({ include: 'src/**' })
    ]
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/es.js',
      format: 'es',
      name: 'stx',
      sourcemap: 'inline'
    },
    plugins: [
      nodeResolve({ browser: true }),
      buble({ include: 'src/**' })
    ]
  }
]
