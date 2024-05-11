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

    const url = "https://localhost:7081/api/v1/profile/additional";
    const method = "POST";
    var json = {
      Data: {
        EducationItems: [
          {
            Id: "c94f024e-eec9-4fb2-b2ec-4715e3084865",
            CountryCode: "VNM",
            UniversityName: "Test",
            MajorName: "Information Technology",
            DisplayOrder: 1,
            Files: [
              {
                "id": "6c70410e-8001-4373-9438-08ea7ccccf76",
                DisplayOrder: 888,
                File: files[0]
              },
            ],
          },
          {
            Id: "e9df3292-3993-434b-afa1-93363a770205",
            CountryCode: "KOR",
            UniversityName: "Korean University",
            MajorName: "Korean Information Technology",
            DisplayOrder: 2,
            Files: [
              {
                "id": "33b55aeb-4850-421e-96f5-cf2b6f191fb4",
                DisplayOrder: 2,
                File: files[1]
              },
            ],
          }
        ],
        CertificateItems: [
          {
            "id": "5a8729c5-8e03-4777-a443-92f5972120c7",
            CertificateName: "Siêu cấp víp rồ",
            CertificateIssuer: "Tự Chế",
            DisplayOrder: 3,
            Files: [
              {
                "id": "7e625b5c-815c-47cf-b1b8-8d48c22322fd",
                DisplayOrder: 1,
                File: files[1]
              },
            ],
          }
        ],
        Blog:  {
          "id": "3e0edee8-c2b7-4ec4-8bce-f65baa7242f8",
            Url: "link blog 99999",
            DisplayOrder: 9999
          },
        SNS: [
        {
          "id": "8b39ff33-ae2c-437a-8a50-eeea29590660",
            Url: "link sns 8888",
            DisplayOrder: 888888,
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
