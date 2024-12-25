export default {
    designer: {
        minify: true,
        pages: [
            {
                filename: 'designer',
                entry: 'src/project/designer/main.js',
                template: 'designer.html',
            }
        ]
    },
    danmuku: {
        minify: true,
        pages: [
            {
                filename: 'danmuku',
                entry: 'src/project/danmuku/danmuku-main.js',
                template: 'danmuku.html',
            }
        ]
    }
}
export const projects = {
    designer: {
        name: 'designer',
        buildCommand: 'cross-env PROJECT_NAME=designer vite build',
        desc: '设计器',
    },
    danmuku: {
        name: 'danmuku',
        buildCommand: 'cross-env PROJECT_NAME=danmuku vite build',
        desc: '皮肤',
    },
}