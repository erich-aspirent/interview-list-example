#!/usr/bin/env node
const fs = require('fs-extra')
const path = require('path')

const createComponent = () => {
  const { componentName } = options
  const paths = buildPaths()
  const contents = buildContents()

  const logs = [`Created ${componentName}`]

  Object.keys(paths).forEach((fileType) => {
    const filePath = paths[fileType]
    try {
      fs.outputFileSync(filePath, adjustIndentation(contents[fileType]))
      logs.push(
        `${fileType.padStart(10)}: ${filePath}`,
      )
    } catch (error) {
      logs.push(`Error creating ${filePath}`)
    }
  })
  console.log(logs.join('\n  '))
}

const buildContents = () => {
  const { componentName } = options
  const className = hyphenate(componentName)
  const component = `
    import React from 'react'
    import './${componentName}.scss'

    const ${componentName} = () => {

      return (
        <div className="${className}">
          {/* content goes here */}
        </div>
      )
    }

    export default ${componentName}
  `

  const stylesheet = `
    .${className} {
      display: flex;

    }
  `

  const test = `
    import React from 'react'
    import { render, screen } from '@testing-library/react'
    import ${componentName} from './${componentName}'

    const renderComponent = async () => {
      await render(<${componentName} />)
    }

    beforeEach(() => {

    })

    it('renders', async () => {
      await renderComponent()
      screen.debug()
    })
  `

  const index = `
    export { default } from './${componentName}'
  `

  return {
    component,
    stylesheet,
    test,
    index,
  }
}

const buildPaths = () => {
  const { componentName, componentPath } = options
  const getPath = (name) => {
    return path.join(componentPath, name)
  }
  const paths = {
    component: getPath(`${componentName}.js`),
    stylesheet: getPath(`${componentName}.scss`),
    test: getPath(`${componentName}.test.js`),
    index: getPath('index.js'),
  }
  Object.values(paths).forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      console.log('File already exists:', filePath)
      process.exit(1)
    }
  })
  return paths
}

const adjustIndentation = (str) => {
  return str
    .split('\n')
    .slice(1)
    .map((line) => line.slice(4))
    .join('\n')
}

/**
 * @see https://github.com/sindresorhus/decamelize
 */
const hyphenate = (componentName) => {
  return componentName
    .replace(/([\p{Lowercase_Letter}\d])(\p{Uppercase_Letter})/gu, '$1-$2')
    .replace(
      /(\p{Uppercase_Letter}+)(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
      '$1-$2',
    )
    .toLowerCase()
}

const usage = () => {
  console.log(`Usage: ${__filename} path/to/ComponentName`)
  process.exit(0)
}
const options = (() => {
  const argv = require('minimist')(process.argv.slice(2))
  console.dir(argv)
  // process.exit()
  if (argv.h) {
    usage()
  }
  const pathArg = argv._[0]
  if (!pathArg) {
    usage()
  }
  const relativePath = pathArg.replace(/^(.\/)?(src\/)?/, '').replace(/.js$/, '')
  const componentName = path.basename(relativePath)
  if (!/^[A-Z]/.test(componentName)) {
    console.log('Component names must begin with a capital letter')
    process.exit()
  }
  const componentPath = path.join(
    __dirname,
    '..',
    'src',
    relativePath,
  )

  return {
    componentName,
    componentPath,
    createStylesheet: argv.s,
  }
})()

createComponent()
