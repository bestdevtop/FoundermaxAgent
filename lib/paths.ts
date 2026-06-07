import os from 'os'
import path from 'path'

/** Bundled read-only data shipped with the app (CSV, JSON, policy docs). */
export const DATA_DIR = path.join(process.cwd(), 'data')

/** True on Vercel and other serverless runtimes where the project dir is read-only. */
export const IS_SERVERLESS =
  Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)

/** Writable directory for SQLite and generated indexes (/tmp on serverless). */
export const RUNTIME_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), 'foundermax')
  : DATA_DIR

export const DB_PATH = path.join(RUNTIME_DIR, 'foundermax.db')
