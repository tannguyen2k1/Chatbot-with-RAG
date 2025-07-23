import CodeDialog from "@/app/components/shared/CodeDialog";
import React from "react";
const SimpleDialogCode = () => {
    return (
        <>
            <CodeDialog>
                {`
"use client";
import * as React from 'react';
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  List,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from '@mui/material';
import { IconUser, IconPlus } from '@tabler/icons-react';
const emails = ['JohnDeo@gmail.com', 'SmithRocky@gmail.com'];

const SimpleDialog = () => {
const [open, setOpen] = React.useState(false);
const [selectedValue, setSelectedValue] = React.useState(emails[1]);

const handleClickOpen = () => {
  setOpen(true);
};

const handleClose = (value: string) => {
  setOpen(false);
  setSelectedValue(value);
};

return (
  <>
    <Button variant="contained" color="primary" fullWidth onClick={handleClickOpen}>
      Open Simple Dialog
    </Button>
     <Typography
      variant="subtitle1"
      component="div"
      sx={{
        mb: 1,
        textAlign: "center"
      }}>
      Selected: {selectedValue}
    </Typography>
    <Dialog onClose={() => handleClose(selectedValue)} open={open}>
      <DialogTitle>Set backup account</DialogTitle>
      <List sx={{ pt: 0 }}>
        {emails.map((email) => (
          <ListItemButton  onClick={() => handleClose(email)} key={email}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                <IconUser width={20} height={20} />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={email} />
          </ListItemButton>
        ))}

       <ListItemButton autoFocus onClick={() => handleClose('addAccount')}>
          <ListItemAvatar>
            <Avatar>
              <IconPlus width={20} height={20} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Add account" />
      </ListItemButton>
      </List>
    </Dialog>
  </>
);`}
            </CodeDialog>
        </>
    );
};

export default SimpleDialogCode;