/* index.js – Formularlogik für index.html */

/* Set today's date as default */
document.getElementById('date').valueAsDate = new Date();

async function handleSubmit() {
  const company = document.getElementById('company').value.trim();
  const date    = document.getElementById('date').value;

  if (!company || !date) {
    showToast('Bitte Unternehmen und Datum ausfüllen.', 'error');
    return;
  }

  const data = {
    company,
    app_date:         date,
    jobtitle:         document.getElementById('jobtitle').value.trim(),
    link:             document.getElementById('link').value.trim(),
    status:           document.getElementById('status').value,
    contact_name:     document.getElementById('contact_name').value.trim(),
    contact_email:    document.getElementById('contact_email').value.trim(),
    contact_phone:    document.getElementById('contact_phone').value.trim(),
    contact_position: document.getElementById('contact_position').value.trim(),
    notes:            document.getElementById('notes').value.trim(),
  };

  const btn = document.getElementById('submitBtn');
  btn.disabled    = true;
  btn.textContent = 'Wird gespeichert …';

  try {
    await postApplication(data);
    showToast('✓ Bewerbung gespeichert!', 'success');
    clearForm();
  } catch (e) {
    showToast(e.message || 'Fehler beim Speichern.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Bewerbung speichern';
  }
}

function clearForm() {
  ['company', 'jobtitle', 'link', 'contact_name',
   'contact_email', 'contact_phone', 'contact_position', 'notes']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('date').value   = '';
  document.getElementById('status').value = 'Beworben';
  document.getElementById('date').valueAsDate = new Date();
}
