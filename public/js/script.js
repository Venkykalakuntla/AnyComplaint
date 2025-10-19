
function copyDraft() {
  const textToCopy = document.getElementById("complaintText").innerText;
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      alert("Complaint draft copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}

function copyDraft() {
  const textToCopy = document.getElementById("followUpText").innerText;
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      alert("Follow-up draft copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}


function copyTextFromElement(elementId, successMessage) {
    const element = document.getElementById(elementId);

    if (!element) {
        console.error(`Error: Element with ID "${elementId}" not found.`);
        alert('Could not find the text to copy.');
        return;
    }

    const textToCopy = element.textContent || element.innerText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Use the custom success message passed to the function
        alert(successMessage);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Could not copy text automatically. Please try copying manually.');
    });
}


const deleteConfirmModal = document.getElementById("deleteConfirmModal");
if (deleteConfirmModal) {
  deleteConfirmModal.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    const complaintId = button.getAttribute("data-id");
    const deleteForm = document.getElementById("deleteForm");
    deleteForm.action = `/complaint/delete/${complaintId}`;
  });
}
