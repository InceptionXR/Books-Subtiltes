#!groovy

import groovy.json.JsonSlurperClassic
import java.net.URLEncoder;

def containerName = "node"
def name = k8s.normalizeId("ja-unity-${JOB_NAME}".toLowerCase().replace("scan repo", ""))

podTemplate(cloud: 'Bookful Stage', name: name, label: name, containers: [
        containerTemplate(name: containerName, image: 'node:10.16.0-jessie', command: 'cat', ttyEnabled: true)
]) {
    node(name) {
        ws("ws") {
            stage('checkout scm') {
                vcs.checkoutRepo(5, 10)
            }

            stage('print change set') {
                def changedFilesPaths = vcs.getChangeSetsFilesPaths()

                withCredentials([
                        string(credentialsId: 'GITHUB_API_TOKEN', variable: 'GITHUB_API_TOKEN')
                ]) {
                    changedFilesPaths.each {
                        def sourceRepositoryFilePath = it
                        def repositoryName = sourceRepositoryFilePath.split("/")[0]
                        def targetRepositoryFilePath = sourceRepositoryFilePath.replaceAll("${repositoryName}/", "")
                        if (targetRepositoryFilePath != sourceRepositoryFilePath && !targetRepositoryFilePath.contains(".mp3")) {
                            log.info("uploading ${sourceRepositoryFilePath} to ${repositoryName}")

                            def uploadUrl = URLEncoder.encode("https://api.github.com/repos/InceptionXR/${repositoryName}/contents/${targetRepositoryFilePath}", "UTF-8");
                            def fileContent = readFile sourceRepositoryFilePath
                            def content = fileContent.bytes.encodeBase64().toString()
                            def message = "updated by ${JOB_NAME} job, build #${BUILD_NUMBER} [ci] [Books-Subtitles]"

                            def getRequest = new URL(uploadUrl).openConnection();
                            getRequest.setRequestProperty("Authorization", "Bearer ${GITHUB_API_TOKEN}")
                            def rawResponse = getRequest.getInputStream().getText()
                            def response = new JsonSlurperClassic().parseText(rawResponse)
                            def sha = response.sha

                            def data = '{"content":"' + content + '","message":"' + message + '","sha":"' + sha + '"}'

                            def updateFileRequest = new URL(uploadUrl).openConnection();
                            updateFileRequest.setRequestMethod("PUT")
                            updateFileRequest.setDoOutput(true)
                            updateFileRequest.setRequestProperty("Authorization", "Bearer ${GITHUB_API_TOKEN}")
                            updateFileRequest.getOutputStream().write(data.getBytes("UTF-8"));
                            log.info(updateFileRequest.getInputStream().getText());
                        }
                    }
                }
            }
        }
    }
}
