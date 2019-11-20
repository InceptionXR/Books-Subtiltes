#!groovy

def name = k8s.normalizeId("ja-unity-${JOB_NAME}".toLowerCase().replace("scan repo", ""))
def containerName = "node"

podTemplate(cloud: 'Bookful Stage', name: name, label: name, containers: [
        containerTemplate(name: containerName, image: 'node:12.13.0-stretch', command: 'cat', ttyEnabled: true)
]) {
    node(name) {
        ws("ws") {
            stage('checkout scm') {
                vcs.checkoutRepo(5, 10)
            }

            stage('print change set') {
                def changedFilesPaths = vcs.getChangeSetsFilesPaths()

                container(containerName) {
                    withCredentials([
                            string(credentialsId: 'GITHUB_API_TOKEN', variable: 'GITHUB_API_TOKEN')
                    ]) {
                        writeFile file: "changedFilesPaths", text: "${changedFilesPaths.join('\n')}"

                        def message = "updated by ${JOB_NAME} job, build #${BUILD_NUMBER} [ci] [Books-Subtitles]"
                        dir("github-api") {
                            cmd.exe("yarn install")
                        }
                        cmd.exe("CHANGED_FILES_PATHS_FILE=changedFilesPaths COMMIT_MESSAGE=\"${message}\" node github-api/src/index.js")
                    }
                }
            }
        }
    }
}
