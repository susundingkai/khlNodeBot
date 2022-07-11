import {File, FormData} from 'node-fetch'

export default function getImageFile (buf) {
  const image = new File([buf], 'poster.jpg', { type: 'image/jpeg' })
  const formData = new FormData()
  formData.set('file', image, 'poster.jpg')
  return formData
}
