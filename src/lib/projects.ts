import { supabase, ARQUELIA_COMPANY_ID } from './supabase'
import { projectRepository } from './projectRepository'

const repository = projectRepository(supabase, ARQUELIA_COMPANY_ID)
export const getPublishedProjectPage = repository.list
export const getProjectByKey = repository.get
export async function getPublishedProjects() {
  return (await repository.list()).projects
}
