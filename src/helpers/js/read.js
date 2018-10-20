function parseByteArray(byteArray) {
    // We need to setup a try/catch block because parseDicom will throw an exception
    // if you attempt to parse a non dicom part 10 file (or one that is corrupted)
    try {
        // parse byteArray into a DataSet object using the parseDicom library
        var dataSet = dicomParser.parseDicom(byteArray);

        // dataSet contains the parsed elements.  Each element is available via a property
        // in the dataSet.elements object.  The property name is based on the elements group
        // and element in the following format: xggggeeee where gggg is the group number
        // and eeee is the element number with lowercase hex characters.

        // To access the data for an element, we need to know its type and its tag.
        // We will get the sopInstanceUid from the file which is a string and
        // has the tag (0020,000D)
        var sopInstanceUid = dataSet.string('x0020000d');

        // Now that we have the sopInstanceUid, lets add it to the DOM
        $('#sopInstanceUid').text(sopInstanceUid);

        // Next we will get the Patient Id (0010,0020).  This is a type 2 attribute which means
        // that the element must be present but it can be empty.  If you attempt to get the string
        // for an element that has data of zero length (empty) , parseDicom will return
        // undefined so we need to check for that to avoid a script error
        var patientId = dataSet.string('x00100020');
        if (patientId !== undefined) {
            $('#patientId').text(patientId);
        } else {
            $('#patientId').text("element has no data");
        }

        // Next we will try to get the Other Patient IDs Sequence (0010,1002).  This is a type 3 attribute
        // which means it may or may not be present.  If you attempt to get the string
        // for an element that is not present, parseDicom will return
        // undefined so we need to check for that to avoid a script error

        var otherPatientIds = dataSet.string('x00101002');
        if (otherPatientIds !== undefined) {
            $('#otherPatientIds').text(patientId);
        } else {
            $('#otherPatientIds').text("element not present");
        }

        // Next we will try get the Rows (0028,0010) attribute which is required for images.  This
        // is stored with VR type US which is a 16 bit unsigned short field.  To access this, we need
        // to use the uint16 funciton instead:

        var rows = dataSet.uint16('x00280010');
        if (rows !== undefined) {
            $('#rows').text(rows);
        } else {
            $('#rows').text("element not present or has no data");
        }

        // the DataSet object has functions to support every VR type:
        // All string types - string()
        // US - uint16()
        // SS - int16()
        // UL - uint32()
        // SL - int32()
        // FL - float()
        // FD - double()
        // DS - floatString()
        // IS - intString()

        // next we will access the ReferencedImageSequence (0008,1140) element which is of type VR.  A sequence contains one
        // or more items each of which is a DataSet object.  This attribute is not required so may not be present
        var referencedImageSequence = dataSet.elements.x00081140;
        if (referencedImageSequence !== undefined) {
            // sequence items can be empty so we need to check that first
            if (referencedImageSequence.items.length > 0) {
                // get the first sequence item dataSet
                var firstItem = referencedImageSequence.items[0];
                var firstItemDataSet = firstItem.dataSet;

                // now we can access the elements in the sequence data set just like
                // we did above.  In this case we will access the ReferencedSOPClassUID
                // (0008,1150):
                var referencedSOPClassUID = firstItemDataSet.string('x00081150');
                $('#referencedSOPClassUID').text(referencedSOPClassUID);
            }
        }

        // Next we will access values from a multi valued element.  A multi valued element contains multiple values
        // like an array.  We will access the ImagePositionPatient x00200032 element and extract the X, Y and Z
        // values from it;

        if (dataSet.elements.x00200032 !== undefined) {
            var imagePositionPatientX = dataSet.floatString('x00200032', 0);
            var imagePositionPatientY = dataSet.floatString('x00200032', 1);
            var imagePositionPatientZ = dataSet.floatString('x00200032', 2);
            $('#imagePositionPatientX').text(imagePositionPatientX);
            $('#imagePositionPatientY').text(imagePositionPatientY);
            $('#imagePositionPatientZ').text(imagePositionPatientZ);
        }

        // In some cases the number of values in a multi valued element varies.  We can ask
        // for the number of values and the iterate over them
        if (dataSet.elements.x00200032 !== undefined) {
            var numValues = dataSet.numStringValues('x00200032');
            var text = numValues + " (";
            for (var i = 0; i < numValues; i++) {
                var value = dataSet.floatString('x00200032', i);
                text += value + " "
            }
            text += ")";
            $('#imagePositionPatientNumValues').text(text);
        }

        // parseDicom keeps track of the length of each element and its offset into the byte array
        // it was parsed from.  Here we show how we can obtain this by accessing the element directly:
        var sopInstanceUidElement = dataSet.elements.x0020000d;
        var text = "dataOffset = " + sopInstanceUidElement.dataOffset + "; length = " + sopInstanceUidElement.length;
        $('#sopInstanceUidDataOffsetAndLength').text(text);

        // The element also has some other properties that may or not be present:
        // vr - the VR of the element.  Only available for explicit transfer syntaxes
        // hadUndefinedLength - true if the element had an undefined length.
        if (sopInstanceUidElement.vr !== undefined) {
            $('#sopInstanceUidVR').text(sopInstanceUidElement.vr);
        }
    } catch (err) {
        // we catch the error and display it to the user
        $('#parseError').text(err);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Everything below this line deals with responding to files dropped in the dropZone element
// and loading the file and is therefore not directly related to the parseDicom library.
///////////////////////////////////////////////////////////////////////////////////////////////

// load the file dropped on the element and then call parseByteArray with a
// Uint8Array containing the files contents
function loadFile(fileInput) {
    var reader = new FileReader();
    reader.onload = function(file) {
        var arrayBuffer = reader.result;
        // Here we have the file data as an ArrayBuffer.  dicomParser requires as input a
        // Uint8Array so we create that here
        var byteArray = new Uint8Array(arrayBuffer);
        parseByteArray(byteArray);
    }
    reader.readAsArrayBuffer(fileInput);
}

// this function gets called once the user drops the file onto the div
function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    // Get the FileList object that contains the list of files that were dropped
    var files = evt.dataTransfer.files;

    // this UI is only built for a single file so just dump the first one
    loadFile(files[0]);
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
window.onload = function() {
    var dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
}