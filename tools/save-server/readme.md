# Save Server

This save-server script runs a local server to receive images as base64 from the network and then saves them to the file system so that they can then later be combined into an amazing gif.

To use it, you must start a local PHP server with the following command:

```
php -S localhost:8081 ./save.php
```

If you access the [local url](http://localhost:8081/), you will see a test form which you can alter an image and send it to the server as a simple POST request, saving it to disk to validate the mechanism.

The basic idea is that another application with a canvas image can send it with the following javascript snippet:

```js
	const canvas = document.querySelector("canvas");
	const data = new FormData();
	data.append("content", canvas.toDataURL());
	data.append("filename", 'filename.png');
	fetch("http://localhost:8081", {
		method: "post",
		body: data
	}).then(r=>r.text()).then((txt) => {
		console.log("File saved!");
	})
```

Obs: The files will be saved inside a folder named `saved_files` at the root of the server (that will be created if it does not exist)

## Response

You don't actually need to parse the response, but just in case you need to, it is in JSON format:

```js
{
	"success": "true",
	"bytes_written": 100,
	"filename": "filename.png",
	"overwritten": false
}
```

And when an error happens:

```js
{
	"error": "true",
	"message": "Missing 'filename' parameter"
}
```

# That's all

You can take this save server script and use it however you see fit as long as I'm not affected by it.
