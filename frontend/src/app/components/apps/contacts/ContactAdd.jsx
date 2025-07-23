import React, { useContext } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormLabel from '@mui/material/FormLabel';
import { Grid } from '@mui/material';
import TextField from '@mui/material/TextField';
import { ContactContext } from '@/app/context/Conatactcontext';
import { MenuItem, Select } from '@mui/material';

const ContactAdd = () => {

  const [modal, setModal] = React.useState(false);

  const { addContact } = useContext(ContactContext);

  const toggle = () => {
    setModal(!modal);
  };

  const [values, setValues] = React.useState({
    firstname: '',
    lastname: '',
    department: 'Sales',
    company: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const newContact = {
      firstname: values.firstname,
      lastname: values.lastname,
      department: values.department,
      company: values.company,
      phone: values.phone,
      email: values.email,
      address: values.address,
      notes: values.notes,
      starred: false,
      image: '/images/profile/user-2.jpg',
    };
    addContact(newContact);
    setModal(!modal);
  };

  return (<>
    <Box p={3} pb={1}>
      <Button color="primary" variant="contained" fullWidth onClick={toggle}>
        Add New Contact
      </Button>
    </Box>
    <Dialog
      open={modal}
      onClose={toggle}
      maxWidth="sm"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title" variant="h5">
        {'Add New Contact'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Lets add new contact for your application. fill the all field and
          <br /> click on submit button.
        </DialogContentText>
        <Box mt={3}>
          <form onSubmit={handleSubmit}>
            <Grid spacing={3} container>
              <Grid
                size={{
                  xs: 12,
                  lg: 6
                }}>
                <FormLabel>FirstName</FormLabel>
                <TextField
                  id="firstname"
                  size="small"
                  variant="outlined"
                  fullWidth
                  value={values.firstname}
                  onChange={(e) => setValues({ ...values, firstname: e.target.value })}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 6
                }}>
                <FormLabel>LastName</FormLabel>
                <TextField
                  id="lastname"
                  size="small"
                  variant="outlined"
                  fullWidth
                  value={values.lastname}
                  onChange={(e) => setValues({ ...values, lastname: e.target.value })}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 6
                }}>
                <FormLabel>Department</FormLabel>

                <Select
                  id="department"
                  size="small"
                  fullWidth
                  value={values.department}
                  onChange={(e) => setValues({ ...values, department: e.target.value })}
                >
                  <MenuItem value="Sales">Sales</MenuItem>
                  <MenuItem value="Support">Support</MenuItem>
                  <MenuItem value="Engineering">Engineering</MenuItem>
                </Select>
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 6
                }}>
                <FormLabel>Company</FormLabel>
                <TextField
                  id="company"
                  size="small"
                  variant="outlined"
                  fullWidth
                  value={values.company}
                  onChange={(e) => setValues({ ...values, company: e.target.value })}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 6
                }}>
                <FormLabel>Phone</FormLabel>
                <TextField
                  id="phone"
                  size="small"
                  variant="outlined"
                  fullWidth
                  value={values.phone}
                  onChange={(e) => setValues({ ...values, phone: e.target.value })}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 6
                }}>
                <FormLabel>Email</FormLabel>
                <TextField
                  id="email"
                  type="email"
                  required
                  size="small"
                  variant="outlined"
                  fullWidth
                  value={values.email}
                  onChange={(e) => setValues({ ...values, email: e.target.value })}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 12
                }}>
                <FormLabel>Address</FormLabel>
                <TextField
                  id="address"
                  size="small"
                  multiline
                  rows="3"
                  variant="outlined"
                  fullWidth
                  value={values.address}
                  onChange={(e) => setValues({ ...values, address: e.target.value })}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 12
                }}>
                <FormLabel>Notes</FormLabel>
                <TextField
                  id="notes"
                  size="small"
                  multiline
                  rows="4"
                  variant="outlined"
                  fullWidth
                  value={values.notes}
                  onChange={(e) => setValues({ ...values, notes: e.target.value })}
                />
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  lg: 12
                }}>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mr: 1 }}
                  type="submit"
                  disabled={values.firstname.length === 0 || values.notes.length === 0}
                >
                  Submit
                </Button>
                <Button variant="contained" color="error" onClick={toggle}>
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </DialogContent>
    </Dialog>
  </>);
};

export default ContactAdd;