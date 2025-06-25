$(document).ready(function () {
    $("#customerName").text(localStorage.getItem("customerName"));
    $("#equipment").text(localStorage.getItem("equipment"));
    $("#type").text(localStorage.getItem("type"));
    $("#serialNumber").text(localStorage.getItem("serial"));
    $("#necessity").text(localStorage.getItem("necessity"));
    location = localStorage.getItem("selectedLocation")
    if(!location=== ""){
        $("#location").text(location);
    }
    console.log(localStorage.getItem("customerName"));
    console.log(localStorage.getItem("type"));
    console.log(localStorage.getItem("serial"));
    console.log(localStorage.getItem("necessity"));
    console.log(location);
});