package com.lantana.school.course.coursemanagment.services;

import java.net.URI;
import java.util.Enumeration;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.keycloak.KeycloakSecurityContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.lantana.school.course.coursemanagment.security.Identity;

@RestController
public class CourseController {

	@Autowired
	private HttpServletRequest request;

	@Autowired
	private CourseService couseService;

	@GetMapping(value = "/courses", produces = MediaType.APPLICATION_JSON_VALUE)
	public List<Course> getCourses(Model model) throws JsonProcessingException {
		System.out.println("calling get all courses operation");
		configCommonAttributes(model);
		List<Course> courses = couseService.getCourses();
		return courses;
	}

	@GetMapping(value = "/courses/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public Course getCourse(@PathVariable("id") long id, Model model) throws JsonProcessingException {
		System.out.println("calling get course operation for course " + id);
		configCommonAttributes(model);
		Enumeration<String> headers = request.getHeaderNames();
		System.out.println("Get Headers: ");
		while ( headers.hasMoreElements() ) {
			String headerName = headers.nextElement();
			String headerValue = request.getHeader(headerName);
			System.out.println("Header " + headerName + " is " + headerValue);
		}
		Course course = couseService.getCourse(id);
		return course;
	}
	
	@DeleteMapping("/courses/{id}")
	public void deleteStudent(@PathVariable long id) {
		System.out.println("calling delete operation for course " + id);
		couseService.deleteById(id);
	}

	@PostMapping("/courses")
	public ResponseEntity<Course> createCourse(@RequestBody Course course) {
		Course savedCourse = couseService.addCourse(course);

		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
				.buildAndExpand(savedCourse.getCode()).toUri();

		return ResponseEntity.created(location).build();

	}



	private void configCommonAttributes(Model model) {
		model.addAttribute("identity", new Identity(getKeycloakSecurityContext()));

	}

	private KeycloakSecurityContext getKeycloakSecurityContext() {
		return (KeycloakSecurityContext) request.getAttribute(KeycloakSecurityContext.class.getName());
	}


	// private String get
}
