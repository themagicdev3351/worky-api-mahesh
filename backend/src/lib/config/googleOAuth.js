const axios = require('axios')
const url = require('url');
const { oAuth2Client } = require('../../constant/appConstant')
const { staticResponseMessageObject } = require('../../lib/responseMessages/message')

const getAxiosReq = async (url, token) => {
  const options = await axios
    .get(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => { return res.data })
    .catch(error => { return error });
  return options
}

module.exports = {
  googleLogin: async () => {
    const scope = [
      'https://www.googleapis.com/auth/classroom.courses',
      'https://www.googleapis.com/auth/classroom.rosters'
    ]

    const payload = oAuth2Client.generateAuthUrl({ access_type: "offline", scope })
    return payload
  },

  googleBearerToken: async (requestUrl) => {
    const parseUrl = url.parse(requestUrl, true).query
    const tokenObj = await oAuth2Client.getToken(parseUrl.code)
    if (tokenObj && tokenObj.res && tokenObj.res.data && tokenObj.res.data.access_token) return tokenObj.res.data
  
    throw staticResponseMessageObject.somethingWentToWrong
  },

  getClassAndStudnetList: async (token) => {
    const course = await getAxiosReq(`https://classroom.googleapis.com/v1/courses`, token)

    if (course && course.courses && course.courses.length) {
      course.courses = await Promise.all(course.courses.map(async (oneCourse) => {
        oneCourse.students = await getAxiosReq(`https://classroom.googleapis.com/v1/courses/${oneCourse.id}/students`, token).then((e) => {
          if (e && e.students) { return e.students
          } else { return {} }
        })

        let courseObj = {}
        courseObj.id = oneCourse.id
        courseObj.name = oneCourse.name
        courseObj.classGrade = oneCourse.descriptionHeading
        courseObj.studentLength = (oneCourse && oneCourse.students && oneCourse.students.length) ? oneCourse.students.length : '0'
        courseObj.grade = oneCourse.section
        return courseObj
      }))

      return course
    }

    if(course?.response?.status == 401) throw staticResponseMessageObject.verificationTokenExpired

    return {}
  },

  getStudentForSpecificClass: async (token, courseId) => {
    const studentList  = await getAxiosReq(`https://classroom.googleapis.com/v1/courses/${courseId}/students`, token)
    if(studentList?.students) return studentList?.students

    if(studentList?.response?.status == 401) throw staticResponseMessageObject.verificationTokenExpired

    return {}
  },
}