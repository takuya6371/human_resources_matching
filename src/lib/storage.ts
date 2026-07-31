import { supabase } from './supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadProfileImage(file: File, ownerId: string): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('FILE_TOO_LARGE')
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${ownerId}/photo-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('profile-images').upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw error

  const { data } = supabase.storage.from('profile-images').getPublicUrl(path)
  return data.publicUrl
}
