const ngrok_url = "http://3af9-41-13-122-184.ngrok.io";
const auth_token = "CiVodHRwczovL3RyaW5zaWMuaWQvc2VjdXJpdHkvdjEvb2Jlcm9uEkkKKnVybjp0cmluc2ljOndhbGxldHM6N1VwRmtIUEdvektWUWNFSHVLYVZ3TSIbdXJuOnRyaW5zaWM6ZWNvc3lzdGVtczpDU0lSGjCTwP0t3e2BdAKnkSjJIJN1HMwlexAmvYBUGBzR_DEFkGZebj-IdHu48JKhMrjBdegiAA"
let select_template_id = null;

const UUIDv4 = function b(a) { return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b) }

// ------------------------------
// on load
$(document).ready(function () {
	$("#modal_load").load("modal.html");
	// create dropdown of template ids
	load_template_ids();
});


// ------------------------------
async function load_template_ids() {
	const data = {}

	data['auth_token'] = auth_token;

	data['query'] = "SELECT c.id, c.type, c.data FROM c";

	$.ajax({
		dataType: 'json',
		data: data,
		url: `${ngrok_url}/searchWallet`,
		type: "POST",
		success: function (result) {
			const arr = parse_items(result.items);
			// build select options with template ids
			$("#template_id").append(build_select_field_type(arr));

			// add event handler to selection options
			$("#select_template_id").change(function (e) {
				$("#show_fields").empty();
				select_template_id = this.value;
				get_template_json(this.value);
			});
		},
	});
}


// ------------------------------
function parse_items(data) {
	let arr = [];

	for (item in data) {
		let obj = JSON.parse(data[item]);
		arr.push(obj);
	}

	return arr;
}

// ------------------------------
function build_ui(data) {
	let arr = [];

	arr.push('<label>Select credential fields to share:</label>');

	// build ui
	$.each(data.credentialSubject, function (idx, subject) {
		let obj = {};

		// build selection checkbox
		if(idx != 'id') {
			obj[idx] = subject;
			arr.push(build_ui_input(obj));
		}
		
	});

	// 3 add submit button
	arr.push('<div class="form-floating"><button input id="submit" type="submit" class="btn btn-lg btn-block btn-primary" style="margin-bottom: 10px; margin-top: 20px; width: 100%"><i class="fa-solid fa-check" style="margin-right: 10px"></i>Submit</button></div>');

	$("#show_fields").append(arr.join(""));
}

// ------------------------------
// display select option values and fields
function build_ui_input(field) {
	const random = UUIDv4();
	let arr = [];

	arr.push('<div class="form-check">');
	arr.push('<input class="form-check-input template-field" type="checkbox" name="optional_' + random + '" value="'+Object.keys(field)[0]+'" >');
	arr.push('<label class="form-check-label" >');
	arr.push(Object.values(field)[0] + ' (' + Object.keys(field)[0] + ')');
	// access object key field dynamically 
	arr.push('</label>');
	arr.push('</div>');

	return arr.join(``);
}

// ------------------------------
async function get_template_json(template_id) {
	const data = {};

	data['auth_token'] = auth_token;

	data['credential_id'] = template_id;

	$.ajax({
		dataType: 'json',
		data: data,
		url: `${ngrok_url}/createCredentialProof`,
		type: "POST",
		success: function (result) {
			let arr = [];
			const json = JSON.parse(result["proofDocumentJson"]);

			build_ui(json);
		},
	});
}
// ------------------------------
// ** important step
// submit button click
$("#show_fields").submit(async function (e) {
	let selection_fields = [];

	e.preventDefault();

	// create object array send to server
	const arr = transform_rows_to_object($(this).serializeArray());

	// traverse object array
	$.each(arr, function (idx, value) {
		selection_fields.push(value);
	});

	send_data_to_server(select_template_id, selection_fields);
});

// ------------------------------
function transform_rows_to_object(arr) {
	// group three rows and create row object
	let obj = {}

	arr.forEach(element => {
		obj[element.name] = element.value;
	});

	return obj;
}


// ------------------------------
// validate if input fields have values
function validate_form() {
	const credential_template_form = document.getElementById('show_fields')
	// credential_template_form.classList.add('was-validated');

	// if (credential_template_form.checkValidity() === false) {
	// 	show_modal('Error', 'Please complete all input fields.');
	// 	return false;
	// }

	return true;
}

// ------------------------------
// overlaod function without account_email
async function send_data_to_server(credential_id, credential_values) {
	let data = {};
	let url = `${ngrok_url}/createCredentialSelectiveProofAndVerify`;

	data['auth_token'] = auth_token;

	// get select option value
	data['credential_id'] = credential_id;

	// { field_name: value, field_name: value, ... }
	data['credential_fields'] = JSON.stringify(credential_values)

	// if input url provided then use that
	// url = ($("#verifier_url").val() != '') ? $("#verifier_url").val() : url; 

	// generate selection credential proof
	$.ajax({
		dataType: 'json',
		data: data,
		url: url,
		type: "POST",
		success: function (result) {
			console.log('selective proof', result);

			// loop through results
			let arr_format = []; 
			
			for (const results in result.validationResults) {
				let json_obj = result.validationResults[results];

				// loop through json fields
				for (const field in json_obj) {
					console.log(field, json_obj[field]);
					if(field == 'isValid') {
						const statusValid = (json_obj[field] == true) ? '<i class="fa-sharp fa-solid fa-circle-check" style="color: #9FC131"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';
						arr_format.push('<p>' + results + ' ' + field + ' ' +  statusValid  + '</p>');
					}
				}

			};

			show_modal('Credential verified successfully!', '<p><b>Verification Proof:</b> <p> ' + arr_format.join('') + '<p></p>');
		},
		error: function (result) {
			show_modal('Error', 'Server could not complete request.');
		}
	});
}

// ------------------------------
function show_save_modal(header, body, data) {
	$("#save_modal_header")[0].innerHTML = header;
	$("#save_modal_body")[0].innerHTML = "<p>" + body + "</p>";
	$("#save_modal").modal('show');

	// attach button event handlers after 
	$("#send_email").on("click", function (e, target, value) {
		console.log('send email')
		// send to server
		send_data_to_server_email($("#account_email").val(), select_template_id, data);
	});

	// event handler for copy button
	var clipboard = new ClipboardJS('#copy_btn');
	clipboard.on('success', function (e) {
		navigator.clipboard.writeText(e.text);
		alert('copied');
	})
}

// ------------------------------
function loop_through_data(data, arr) {
	$.each(data, function (key, value) {
		if (typeof value === 'object') {
			arr.push('<p><b>' + key + ':</b></p>');
			$.each(value, function (idx, val) {
				if (typeof idx === 'number') {
					arr.push('<li>' + val + '</li>')
				} else {
					arr.push('<li><u>' + idx + '</u>: ' + val + '</li>')
				}
			});
			arr.push('<br/>')
		} else {
			arr.push('<p><b>' + key + ':</b> ' + value + '</p>')
		}
	})
	return arr;
}


// ------------------------------
function build_for_email(data) {
	let arr = [];


	arr.push('<p>This will associate the credential to your account email address rather than send an email notification with credential.</p>');
	arr.push('<div class="input-group mb-3">');
	arr.push('<input type="text" class="form-control outline-primary" id="account_email" placeholder="dnaicker@gmail.com" value="dnaicker@gmail.com">');
	arr.push('<button class="btn btn-outline-primary" type="button" id="send_email">Send</button>');
	arr.push('</div>');


	return arr.join("");
}

// ------------------------------
function build_credential_save_modal(data, credential_json) {
	let arr = [];

	console.log(credential_json);

	arr.push("<div>");
	arr.push("<p><u>Option 1: Send to email address</u></p>");
	// add email input field
	arr.push(build_for_email(data));
	arr.push("<p><u>Option 2: Download using QR Code to mobile wallet</u></p>");
	// add qr code image
	// todo find a better way to generate qr code
	
	arr.push("<p><img src='https://chart.googleapis.com/chart?cht=qr&chl="+ credential_json + "&chs=200x200&chld=L|1' alt='qr code' /><p>");
	arr.push("<p><u>Option 3: Download credential as JSON</u></p>");
	arr.push("<p><a class='btn btn-primary' href='data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(credential_json))+"' download='credential.json' target='_blank'><i class='fa-solid fa-scroll icon-spacing'></i>Download Credential JSON</a></p>");
	arr.push("<p><u>Option 4: Download credential as PDF</u></p>");
	arr.push("<p><u>Option 5: Copy credential to clipboard</u></p>");
	arr.push("<p><button id='copy_btn' class='btn btn-primary' data-clipboard-text='"+JSON.stringify(credential_json)+"'><i class='fa-solid fa-copy icon-spacing'></i>Copy Credential JSON Text</button></p>");
	// arr.push("<p style='overflow-wrap: break-word;'><i>"+JSON.stringify(credential_json)+"<i></p>");
	arr.push("</div>");

	return arr.join("");
}

// ------------------------------
function build_select_field_type(data) {
	let arr = [];
	arr.push("<div>");
	arr.push("<label class='form-label'>Select Credential</label>");
	arr.push("<select id='select_template_id' class='form-select template-field form-control' name='type' required data-live-search='true'>");
	for (let i = 0; i < data.length; i++) {
		arr.push("<option value='" + data[i].id + "'>" + data[i].id + "</option>");
	}
	arr.push("</select>");
	arr.push("</div>");
	return arr.join("");
}

// ------------------------------
function show_modal(header, body) {
	$("#modal_header")[0].innerHTML = header;
	$("#modal_body")[0].innerHTML = "<p style=''>" + body + "</p>";
	$("#modal").modal('show');
}

// ------------------------------
function show_confirmation_modal(header, body, confirm_callback) {
	$("#confirmation_modal_header")[0].innerHTML = header;
	$("#confirmation_modal_body")[0].innerHTML = "<p>" + body + "</p>";
	$("#confirmation_modal").modal('show');
	$("#modal_button_confirm").on("click", function (e) {
		confirm_callback();
		$("#confirmation_modal").modal('hide');
	});
}