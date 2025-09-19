import { app } from 'electron'

export const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

export const isMac = process.platform === 'darwin'
export const isWindows = process.platform === 'win32'
export const isLinux = process.platform === 'linux'

export const getAppPath = () => {
  return isDev ? process.cwd() : app.getAppPath()
}

export const getUserDataPath = () => {
  return app.getPath('userData')
}

export const getLogsPath = () => {
  return app.getPath('logs')
}

export const getTempPath = () => {
  return app.getPath('temp')
}
