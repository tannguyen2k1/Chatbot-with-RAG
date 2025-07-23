'use client';
import { alpha, styled } from '@mui/material/styles';
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem';
import { IconFolderPlus, IconFolderMinus, IconFolder } from '@tabler/icons-react';
import Breadcrumb from '@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb';
import PageContainer from '@/app/components/container/PageContainer';
import ParentCard from '@/app/components/shared/ParentCard';
import ChildCard from '@/app/components/shared/ChildCard';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Treeview',
  },
];

function MinusSquare(props) {
  return (
    <IconFolderMinus style={{ width: 22, height: 22 }} {...props} />
  );
}

function PlusSquare(props) {
  return (
    <IconFolderPlus style={{ width: 22, height: 22 }} {...props} />
  );
}

function CloseSquare(props) {
  return (
    <IconFolder style={{ width: 22, height: 22 }} {...props} />
  );
}

function TransitionComponent(props) {
  const style = useSpring({
    from: {
      opacity: 0,
      transform: 'translate3d(20px,0,0)',
    },
    to: {
      opacity: props.in ? 1 : 0,
      transform: `translate3d(${props.in ? 0 : 20}px,0,0)`,
    },
  });

  return (
    <animated.div style={style}>
      <Collapse {...props} />
    </animated.div>
  );
}
const StyledTreeItem = styled(TreeItem)(({ theme }) => ({
  [`& .${treeItemClasses.iconContainer}`]: {
    '& .close': {
      opacity: 0.3,
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 15,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },

}));


const Treeview = () => {
  return (
    <PageContainer title="Treeview" description="this is Treeview">
      {/* breadcrumb */}
      <Breadcrumb title="Treeview" items={BCrumb} />
      {/* end breadcrumb */}
      <ParentCard title="Treeview">
        <ChildCard>
          <SimpleTreeView
            aria-label="customized"
            defaultExpandedItems={['1']}
            slots={{
              expandIcon: PlusSquare,
              collapseIcon: MinusSquare,
              endIcon: CloseSquare,
              groupTransition: TransitionComponent,
            }}

            sx={{ height: 200, flexGrow: 1, overflowY: 'auto' }}

          >
            <StyledTreeItem itemId="1" label="Main" >
              <StyledTreeItem itemId="2" label="Hello" />
              <StyledTreeItem itemId="3" label="Subtree with children">
                <StyledTreeItem itemId="6" label="Hello" />
                <StyledTreeItem itemId="7" label="Sub-subtree with children">
                  <StyledTreeItem itemId="9" label="Child 1" />
                  <StyledTreeItem itemId="10" label="Child 2" />
                  <StyledTreeItem itemId="11" label="Child 3" />
                </StyledTreeItem>
                <StyledTreeItem itemId="8" label="Hello" />
              </StyledTreeItem>
              <StyledTreeItem itemId="4" label="World" />
              <StyledTreeItem itemId="5" label="Something something" />
            </StyledTreeItem>
          </SimpleTreeView>
        </ChildCard>
      </ParentCard>
    </PageContainer >
  );
};

export default Treeview;
