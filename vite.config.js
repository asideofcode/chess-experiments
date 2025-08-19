import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'

// Plugin to copy Stockfish files from node_modules
const stockfishPlugin = () => ({
  name: 'copy-stockfish',
  buildStart() {
    const stockfishSrc = resolve(__dirname, 'node_modules/stockfish/src')
    const publicStockfish = resolve(__dirname, 'public/stockfish')
    
    if (!existsSync(publicStockfish)) {
      mkdirSync(publicStockfish, { recursive: true })
    }
    
    // Auto-detect latest Stockfish files
    const files = readdirSync(stockfishSrc)
    
    // Find the latest multi-threaded engine (non-lite, non-single, non-asm)
    const mainEngineFiles = files.filter(f => 
      f.startsWith('stockfish-') && 
      f.endsWith('.js') && 
      !f.includes('lite') && 
      !f.includes('single') && 
      !f.includes('asm')
    )
    
    if (mainEngineFiles.length === 0) {
      console.error('No suitable Stockfish engine found!')
      return
    }
    
    // Use the first (and likely only) main engine file
    const mainEngine = mainEngineFiles[0]
    const engineBase = mainEngine.replace('.js', '')
    
    console.log(`Using Stockfish engine: ${mainEngine}`)
    
    // Find all WASM parts for this engine
    const wasmFiles = files.filter(f => 
      f.startsWith(engineBase + '-part-') && 
      f.endsWith('.wasm')
    )
    
    // Copy main engine file
    const mainSrc = resolve(stockfishSrc, mainEngine)
    const mainDest = resolve(publicStockfish, mainEngine)
    if (existsSync(mainSrc)) {
      copyFileSync(mainSrc, mainDest)
      console.log(`Copied ${mainEngine}`)
      
      // Create stockfish.js symlink
      const symlinkDest = resolve(publicStockfish, 'stockfish.js')
      copyFileSync(mainSrc, symlinkDest)
      console.log(`Created stockfish.js -> ${mainEngine}`)
    }
    
    // Copy WASM files and create symlinks
    wasmFiles.forEach((file, index) => {
      const src = resolve(stockfishSrc, file)
      const dest = resolve(publicStockfish, file)
      if (existsSync(src)) {
        copyFileSync(src, dest)
        console.log(`Copied ${file}`)
        
        // Create stockfish-part-X.wasm symlink
        const symlinkName = `stockfish-part-${index}.wasm`
        const symlinkDest = resolve(publicStockfish, symlinkName)
        copyFileSync(src, symlinkDest)
        console.log(`Created ${symlinkName} -> ${file}`)
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stockfishPlugin()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
  optimizeDeps: {
    exclude: ['stockfish']
  },
  assetsInclude: ['**/*.wasm']
})
