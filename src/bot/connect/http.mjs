import fetch, { FormData, File, fileFrom } from 'node-fetch'

export default function getImageFile (buf) {
  const image = new File([buf], 'poster.jpg', { type: 'image/jpeg' })
  // console.log(image)
  const formData = new FormData()
  // formData.set('file', image, 'poster.jpg')
  formData.set('file', image, 'poster.jpg')
  return formData
}
