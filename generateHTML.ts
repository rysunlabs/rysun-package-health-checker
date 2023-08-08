export const createHTMLTemplate = (data) => {

    let template = ""

    const createTRtags = (responseData) => {
        let templateForTR = ""
        for(let i in responseData){			
			if(responseData[i].isThreeMonthAgo){
				templateForTR += `<tr style="background-color: red">\n`
			}
			else{
				templateForTR += `<tr>\n`
			}
			templateForTR += `<td style="padding: 5px; border: 1px solid #000;">${i}</td>
			<td style="padding: 5px; border: 1px solid #000; text-align: center; ">${responseData[i].open_issues !== "" ? responseData[i].open_issues : "-"}</td>
			<td style="padding: 5px; border: 1px solid #000;">${responseData[i].last_published}</td>
			<td style="padding: 5px; border: 1px solid #000; text-align: center;">${responseData[i].curr_version}</td>
			<td style="padding: 5px; border: 1px solid #000; text-align: center;">${responseData[i].downloaded_version}</td>
			<td style="padding: 5px; border: 1px solid #000;">${responseData[i].weekly_downloads}</td>`

			if(responseData[i].git_url !== ""){
				templateForTR += `<td style="padding: 5px; border: 1px solid #000;"><a href=${responseData[i].git_url}>${i}</a></td>`
			}
			else{
				templateForTR += `<td style="padding: 5px; border: 1px solid #000; text-align: center;">-</td>`
			}

			templateForTR += `<td style="padding: 5px; border: 1px solid #000;"><a href=${responseData[i].npm_url}>${i}</a></td>
			<td style="padding: 5px; border: 1px solid #000; text-align: center;">${(responseData[i].quality * 100).toFixed(2)}%</td>
			<td style="padding: 5px; border: 1px solid #000; text-align: center;">${(responseData[i].popularity * 100).toFixed(2)}%</td>
			<td style="padding: 5px; border: 1px solid #000; text-align: center;">${(responseData[i].maintenance * 100).toFixed(2)}%</td>
			<td style="padding: 5px; border: 1px solid #000; text-align: center;">${(responseData[i].final * 100).toFixed(2)}%</td>
		</tr>`
        }
        return templateForTR
    }

    template += `
<!DOCTYPE html>
<html lang="en" xml:lang="en">
<head>
	<meta content="text/html; charset=utf-8" />
	<title>Table Example</title>
</head>
<body>
	<table style="border-collapse: collapse; width: 100%;">
	  <thead style="background-color: #ddd;">
		<tr>
	      <th style="padding: 5px; border: 1px solid #000;">Module Name</th>
	      <th style="padding: 5px; border: 1px solid #000;">Open Issues</th>
	      <th style="padding: 5px; border: 1px solid #000;">Last Modified</th>
	      <th style="padding: 5px; border: 1px solid #000;">Current Version</th>
	      <th style="padding: 5px; border: 1px solid #000;">Application Version</th>
	      <th style="padding: 5px; border: 1px solid #000;">Weekly Downloads</th>
	      <th style="padding: 5px; border: 1px solid #000;">Git URL</th>
	      <th style="padding: 5px; border: 1px solid #000;">NPM URL</th>
	      <th style="padding: 5px; border: 1px solid #000;">Quality score</th>
	      <th style="padding: 5px; border: 1px solid #000;">Popularity score</th>
	      <th style="padding: 5px; border: 1px solid #000;">Maintenance score</th>
	      <th style="padding: 5px; border: 1px solid #000;">Final score</th>
	    </tr>
	  </thead>
	  <tbody>
	    <!-- Dynamically generate table rows using map() -->
	    ${createTRtags(data)}
	  </tbody>
	</table>
</body>
</html>`


return template
}