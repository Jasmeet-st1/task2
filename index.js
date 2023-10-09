// importing packages
const express = require('express');
const cors = require("cors");
const lodash = require("lodash");

const app = express();


// url and header definition
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

//for testing

// const url = 'https://mocki.io/v1/eecd07cf-bdef-44ec-94a6-e806561fae3e';	// url link with wrong data
// const url = 'https://mocki.io/vasdas1/eecd07cf-bdef-44ec-94a6-e806561fae3e';	// faluty url link
const url = 'https://intent-kit-16.hasura.app/api/rest/blogs';  //original url link

const options = {
	method: 'GET',
	headers: {
		"x-hasura-admin-secret": '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
	}
};


app.use(cors());


//global object to store data for afterward use
let response;

// function to fetch data and perform analysis
const performAnalysis= (response)=>{
	try {
		// let answer = {};
	
		const dataWithLongestTitle = lodash.maxBy(response.blogs, obj => obj.title.length); 	// to find blog with longest title
		const numberOfBlogsWithPrivacy = lodash.filter(response.blogs, blog => lodash.includes(blog.title.toLowerCase(), 'privacy')).length;	// number of blogs having word privacy in their title
		const uniqueBlogs = lodash.uniqBy(response.blogs, 'title').map(blog => blog.title);		// list of title of unique blogs
	
	
		// storing it in a json data

		answer={
			numberOfBlogs : response.blogs.length,
			blogWithLongestTitle : dataWithLongestTitle.title,
			numberOfBlogsWithPrivacy : numberOfBlogsWithPrivacy,
			uniqueBlogs : uniqueBlogs,
		}
	
		return answer;
	} catch (err) {
		return null;
	}

};


// function for query searching
const searchBlog = (query)=>{
	return response.blogs.filter(blog => blog.title.toLowerCase().includes(query));
}


// making both function memoized by lodash
const memoizedAnalysis = lodash.memoize(performAnalysis ,response=>response, 5000);
const memoizedSearch = lodash.memoize(searchBlog , query=> query, 5000);


// get request for fetch and analysis
app.get("/api/blog-stats", async function (req, res) {

	try{
		response = await fetch(url, options);
		if (!response.ok) {
			res.status(404).send("Url not found. Kindly recheck URL");
		}
		else{
			response = await response.json();
	
			answer= memoizedAnalysis(response);
			if(answer===null) res.status(404).send( "Inappropriate data. Kindly recheck URL" );
			
			else res.status(200).json(answer);

		}
	}
	catch(err){
		res.status(500).send("Url not found. Kindly recheck URL");
	}


});


// get request for query search
app.get("/api/blog-search", (req, res) => {
	const query = req.query.query.toLowerCase(); // Get the query parameter and convert to lowercase for case-insensitive search

	if(response){
		const filteredBlogs = memoizedSearch(query);
		if(filteredBlogs.length!=0) res.status(200).json(filteredBlogs);
		else res.status(404).send(`No data found. Try some other search query `);
	}
	else res.status(404).send(`No data found. First run api "/api/blog-stats" `)

})

// stating the server
app.listen(5000, () => {
	console.log("Server started");
});