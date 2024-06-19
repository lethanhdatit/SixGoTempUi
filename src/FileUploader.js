import React, { useState } from "react";
import axios from "axios";

function FileUploader({ accessToken }) {
  const [files, setFiles] = useState([]);

  const handleFileChange = async (event) => {
    setFiles(Array.from(event.target.files));
  };

  function convertJsonToFormData(json) {
    const formData = new FormData();
  
    function addObjectToFormData(formData, data, parentKey) {
      if (data instanceof File) {
        formData.append(parentKey, data);
      } else if (data instanceof FileList || (Array.isArray(data) && data[0] instanceof File)) {
        // Append each file under the same key without brackets
        [...data].forEach(file => {
          formData.append(parentKey, file);
        });
      } else if (Array.isArray(data)) {
        // Append array values with their indexes for non-File arrays
        data.forEach((item, index) => {
          if (typeof item === 'object' && !(item instanceof File)) {
            Object.keys(item).forEach(key => {
              addObjectToFormData(formData, item[key], `${parentKey}[${index}].${key}`);
            });
          } else {
            formData.append(`${parentKey}[${index}]`, item);
          }
        });
      } else if (typeof data === 'object') {
        // Recursively append object properties
        Object.keys(data).forEach(key => {
          addObjectToFormData(formData, data[key], parentKey ? `${parentKey}.${key}` : key);
        });
      } else {
        // Append single values directly
        formData.append(parentKey, data);
      }
    }
  
    addObjectToFormData(formData, json);
  
    return formData;
  }

  const handleUploads = async () => {
    // const url = "https://localhost:7081/api/v1/profile/technical";
    // const method = "POST";
    // var json = {
    //   Data: {
    //     specializations: [
    //       {
    //         id: "31c6864c-fc03-4267-892b-d27b03f5cfd9",
    //         FinalLevelSpecializationCode: "ENGLISHTRANSLATION",
    //         explanation: "English",
    //         periodFrom: 2001,
    //         PeriodTo: 2022,
    //         displayOrder: 1,
    //       },
    //       {
    //         id: "7fc962d2-d44a-4c5c-9c65-5d9ac7b23cdd",
    //         FinalLevelSpecializationCode: "PILATES",
    //         explanation: "PILATES",
    //         periOdFrom: 2012,
    //         PerioDTo: 2024,
    //         displayOrder: 2
    //       }
    //     ],
    //     // Portfolios: files.map((s, i) => 
    //     //   ({
    //     //     DisplayOrder: i,
    //     //     File: s
    //     //   })),
    //     portfolios: [
    //       {
    //         id: "83dc577c-3fbd-4d16-ba6b-a5ddb41fd6bd",
    //         DisplayOrder: 2,
    //         file: files[1]
    //       },
    //       // {
    //       //   //Id: "95d8810b-744a-4cfd-9973-4bfa52373c92",
    //       //   DisplayOrder: 4,
    //       //   File: files[0]
    //       // },
    //       // ...files.map((s, i) => 
    //       // ({
    //       //   DisplayOrder: i,
    //       //   File: s
    //       // }))
    //     ]
    //   },
    // };

    const url = "https://localhost:7081/api/v1/products/classes/basic";
    const method = "POST";
    var json = {
      Data: {
        FinalLevelCategoryCode: 'CTG11100000001',
        Name: "test",
        ProductTypeCode: 'PRCTG110000002',
        LangCodes: ['vie', 'eng'],
        Images:[
          {
            File: files[0],
            DisplayOrder: 0
          },
          {
            File: files[0],
            DisplayOrder: 1
          },
          {
            File: files[0],
            DisplayOrder: 2
          }
        ]
      },
    };

    const formData = convertJsonToFormData(json);

    try {
      const response = await fetch(url, {
        method: method,
        body: formData,
        headers: { Authorization: `bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result); // Handle the response data here
    } catch (error) {
      console.error("There was an error!", error);
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUploads}>Test API</button>
    </div>
  );
}

export default FileUploader;
