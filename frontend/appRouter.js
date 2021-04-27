const express = require("express");
const keycloak = require("./keyCloak");
const appController = require('./appController');

const router = express.Router();

// const checkUserRole = (token, request) => {
//     // console.log('Check user role. token: ', token);
//     console.log('has user role:', token.hasRole('user'));
//     console.log('has admin role:', token.hasRole('admin'));
//     return token.hasRole('user') || token.hasRole('admin');
// }

router.get("/", appController.getHomePage);

router.get("/courses", keycloak.checkAccessToken, appController.getCourses);

// router.get("/courses/:courseId", appController.getPosts);

router.post("/course_del", keycloak.checkAccessToken, appController.deleteCourse);

router.get("/login", appController.getLoginPage);
router.post("/authenticate", appController.authenticate);

router.get("/logoff", appController.getLogoffPage);
router.post("/logoff", appController.getLogoffPage);

router.post("/access", appController.getAccessToken);

router.get("/denied", appController.getAccessDeniedPage);
router.get("/500", appController.getErrorPage);

module.exports = router;
