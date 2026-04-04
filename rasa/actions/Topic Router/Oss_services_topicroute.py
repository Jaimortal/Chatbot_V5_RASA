# all the oss services topic route will be stored
OSS_SERVICES_TOPIC_PATTERNS = {
    "Student_id_fee": {
        "phrases": [
            "do I have to pay for the student id",
            "naa bay bayad ang id",
            "is the buksu id free",
            "pila ang cost sa id nato",
            "are we paying for school id"
        ],
        "strong_keywords": [
            "free", "libre", "cost", "price", "pay", "fee", "payment"
        ],
        "weak_keywords": [
            "fee", "pay", "bayad", "id", "pila", "student", "school", "naa",
            "getting", "gets", "get"
        ],
        "required_context": []
    },
    "Requirement_get_id": {
        "phrases": [
            "what are the requirements for student id",
            "unsa ang dal on para kuha kog id",
            "requirements to get id",
            "unsa dalahon para maka id",
            "what do I need to bring for my id"
        ],
        "strong_keywords": [
            "requirements", "requirement", "bring", "dal", "dalahon"
        ],
        "weak_keywords": [
            "id", "what", "need", "unsa", "kuha", "get", "para", "maka", "get"
        ],
        "required_context": []
    },
    "lost_student_id_replacement_process": {
        "phrases": [
            "what to do if I lost my id",
            "unsaon kung nawala ang id",
            "how to replace lost id",
            "nawala akoang id unsa ang process",
            "how to get replacement id"
        ],
        "strong_keywords": [
            "lost", "nawala", "replacement", "replace", "affidavit"
        ],
        "weak_keywords": [
            "id", "process", "what", "how", "unsaon", "if", "kung", "akoang", "if", "need",
        ],
        "required_context": []
    },
    "request_good_moral_certificate_oss": {
        "phrases": [
            "how to get good moral certificate",
            "asa mukuha og good moral",
            "pila bayad sa good moral",
            "requesting good moral",
            "where to ask for certificate of good moral"
        ],
        "strong_keywords": [
            "moral", "cert", "certificate", "requesting"
        ],
        "weak_keywords": [
            "good", "get", "kuha", "asa", "where", "how", "pila", "bayad"
        ],
        "required_context": []
    },
    "student_id_process": {
        "phrases": [
            "how to get student id",
            "unsa ang process sa pagkuha og id",
            "asa dapit mukuha og id",
            "where do i go to get my id",
            "unsaon pag process sa id"
        ],
        "strong_keywords": [
            "procedure", "where", "asa", "steps",
            "process", "steps"
        ],
        "weak_keywords": [
            "id", "process", "how", "unsaon", "get", "kuha", "student", "go", "dapit",
            "getting", "gets", 
        ],
        "required_context": []
    }
}