;(function(window, undefined) {    
  var gridster;
  var askWidget,editWidget;
  var askLoaded=false,editLoaded=false;
  var curNew;
  var widToDel;
  var curScroll;
  var curFilters={};
  var MASK_DELAY=2000;
  const MASK_DELAY_INIT=2000;
  const VERSION="1.3";
  const DEFAULT_SAMPLE = "manufacturing";
  var mustScrollTop=false;
  var doit;

  window.onresize = function(e){
    clearTimeout(doit);
    if(!e.fake)
      $(".gridster").find(".mask").css('display', 'flex');
    $(".editIfr").parent().css("height",$(".gridster").height()+1+"px");
    $(".askIfr").parent().css("height",$(".gridster").height()+1+"px");
    $(".editIfr").css("height",$(".gridster").height()+60+"px");
    $(".askIfr").css("height",$(".gridster").height()+"px");
    $(".maximized").css("height",$(".gridster").height()+"px");
    doit = setTimeout(function(){resizeVizzes();if(!e.fake)$(".gridster").find(".mask").fadeOut(MASK_DELAY);}, 1000);
  };
  function initDropFileZone(){
    $("#file").on("change", function (event){
      var files = this.files;
      restoreFromFile(files);
    })
    $("#drop_zone").on("dragover", function(event) {
      event.preventDefault();  
      event.stopPropagation();
      $(this).addClass('dragging');
  });
  
  $("#drop_zone").on("dragleave", function(event) {
      event.preventDefault();  
      event.stopPropagation();
      $(this).removeClass('dragging');
  });
  
  $("#drop_zone").on("drop", function(e) {
      $(this).removeClass('dragging');
      e.preventDefault();  
      e.stopPropagation();
      var dt = e.dataTransfer || (e.originalEvent && e.originalEvent.dataTransfer);
      var files = e.target.files || (dt && dt.files);
      restoreFromFile(files);
  });
  }
  function getTabVizFromWidget(widget){
    var id=widget.find(".tableauPlaceholder").attr("id");
    var vizzes=tableau.VizManager.getVizs();
    for(b=0;b<vizzes.length;b++){
      if($(vizzes[b].getParentElement()).attr("id")==id)
        return vizzes[b];
    }
    return null;
  }
  function resizeViz(viz){
      var workbook=viz.getWorkbook();
      activeSheet = workbook.getActiveSheet();
      var w=$(viz.getParentElement()).outerWidth(true);
      var h=$(viz.getParentElement()).outerHeight(true);
      if(activeSheet.getSheetType()==tableau.SheetType.DASHBOARD && activeSheet.getSize().behavior!=tableau.SheetSizeBehavior.AUTOMATIC){
        activeSheet.changeSizeAsync({behavior: tableau.SheetSizeBehavior.EXACTLY, maxSize: { height: h, width: w },minSize: { height: h, width: w }},()=>{
          hideMask($(viz)[0]);
        });
      }
      viz.setFrameSize(w,h);
  }
  function resizeVizzes(){
    var vizzes=tableau.VizManager.getVizs();
    for(b=0;b<vizzes.length;b++){
      var viz=vizzes[b];
      var w, h;
      try {
        w=$(viz.getParentElement()).outerWidth(true);
        h=$(viz.getParentElement()).outerHeight(true);
        var workbook=viz.getWorkbook();
        activeSheet = workbook.getActiveSheet();
        if(activeSheet.getSheetType()==tableau.SheetType.DASHBOARD && activeSheet.getSize().behavior!=tableau.SheetSizeBehavior.AUTOMATIC){
          activeSheet.changeSizeAsync({behavior: tableau.SheetSizeBehavior.EXACTLY, maxSize: { height: h, width: w },minSize: { height: h, width: w }})
        }
      } catch (error) {
        
      }  
        viz.setFrameSize(w,h); 
    }
  }
  function hideMask(div){
    $(div).parent().find(".mask").fadeOut(MASK_DELAY);
  }
  function initModal(){
    initDropFileZone();
    MicroModal.init({
      openTrigger: "data-custom-open", 
      closeTrigger: "data-custom-close", 
      disableScroll: true,
      disableFocus: false, 
      awaitCloseAnimation: true, 
      awaitOpenAnimation: true, 
      debugMode: false
    });
  }
  function showModal(id,e){
    if(e){
      e = e || window.event;
      var target = e.target || e.srcElement;
      widToDel=$(target).parents(".gs-w");
    }
    $('#predefined').val("")
    if(localStorage.getItem("SAMPLE_NEW")!=null)
      $("#shareCode").val(localStorage.getItem("SAMPLE_NEW"));
    MicroModal.show(id,{onClose:()=>{$(".btnMenu").show()}});
    $(".btnMenu").hide();
    $(".gogo").focus();
  }
  function editMode(force){
    if($(".drag_handle").hasClass("hide") || force){
      $(".drag_handle").removeClass("hide");
      $(".gridster").addClass("edit"); 
      $('.newBtn').show();
      $('.close-widget').show();
      gridster.enable_resize();
      gridster.enable();
    }   
    else{
      $(".drag_handle").addClass("hide");
      $(".gridster").removeClass("edit"); 
      $(".tab-widget").removeClass("edit");
      $('.newBtn').hide();
      $('.close-widget').hide();
      gridster.disable_resize();
      gridster.disable();
      if(mobileCheck()==true)
        window.location.reload()
    }
        
  }
  function highLight(){
    $(".gridster .gs-w").addClass("highlight");
  }
  function deHighLight(){
    $(".gridster .gs-w").removeClass("highlight");
  }
  function mobilizeMe(){ 
    if(mobileCheck()==true){
      $(".gridster").css("overflow-y","auto")
    }
  }
  function isPacked(){
    var packed=true;
    gridster.$widgets.each(function(i, widget) {
      widget=$(widget);
      if(gridster.can_go_up(widget)){
        packed= false;
      }
    })
    return packed;
  }
  function packGrid(){
    setTimeout(() => {
      while(isPacked()==false){
        gridster.$widgets.each(function(i, widget) {
          widget=$(widget);
          gridster.move_widget_up(widget,10);
        });
      }
      gridster.set_dom_grid_height();
      gridster.set_dom_grid_width();
    }, 200);
  }
  async function gridize(){
    if(localStorage.getItem("VERSION")!=VERSION){
      var r=await restoreFromUrl(DEFAULT_SAMPLE,false);
    }
    restoreGrid();
    gridster = $(".gridster ul").gridster({
      widget_base_dimensions: ['auto', 30],
      widget_margins: [5, 5],
      avoid_overlapped_widgets:true,
      max_cols:mobileCheck()==true?60:60,
      max_rows:200,
      shift_widgets_up: true,
      shift_larger_widgets_down: true,
      scroll_container:".grid",
      collision: {
          wait_for_mouseup: true
      },
      resize: {
          min_size: [20, 15],
          enabled: true,
          start: function (e, ui, $widget) {
              $(".tab-widget").hide();
              highLight();
              $widget.find(".mask").css('display', 'flex');
          },
          stop: function (e, ui, $widget) {
              $(".tab-widget").show();
              if(mobileCheck()==true){
                $widget.find("iframe").prop("src",$widget.find("iframe").prop("src")+"&tm=1")
                $widget.find(".mask").css('display', 'flex');
              }
              setTimeout(() => {
                $widget.find(".mask").fadeOut(MASK_DELAY);
              }, MASK_DELAY);
              storeGrid();
              deHighLight();
              packGrid();
              gridResize();
              resizeViz(getTabVizFromWidget($widget));
          }
      },
      draggable: {
          handle: '.drag_handle',
          start: function (e, ui, $widget) {
            highLight();
            $(".tab-widget").hide();
          },
          stop: function (e, ui, $widget) {
            $(".tab-widget").show();
            storeGrid();
            deHighLight();
            packGrid();
            gridResize();
            resizeViz(getTabVizFromWidget(ui.$helper))
          }
      }
  }).data('gridster');
    gridResize();
    specialWidget("ask");
    closeWidget("ask",true);
    specialWidget("edit");
    closeWidget("edit",true);
    gridster.disable();
    gridster.disable_resize();
    initModal();
    editMode(true);
    mobilizeMe();
    loadPredefined("predefined");
  }
  function expandWidget(e){
    e = e || window.event;
    var target = e.target || e.srcElement;
    var widget=$(target).parents(".gs-w");
    _expandWidget(widget)
  }
  function gridResize(){
    var ev=new Event('resize');
    ev.fake=true;
    window.dispatchEvent(ev);
  }
  function _expandWidget(widget){
    $(".gs-w").removeClass("player-revert");
    $(".gs-w").removeClass("player");
    if(widget.hasClass("maximized")) {
      $("body").css("margin-left","15px");
      $(".gridster").css("overflow","auto");
      $(".gridster").scrollTop(curScroll);
      $(".btnMenu").show();
      $(".close-widget").css('display', 'flex');
      var style=$(".maximized").attr("style");
      style=$(".maximized").attr("style2");
      $(".maximized").attr("style",style)
      widget.removeClass("maximized");
      widget.find(".mask").css('display', 'flex');
      gridResize();
      setTimeout(() => {
        widget.find(".mask").fadeOut(MASK_DELAY);
      }, MASK_DELAY);
      gridster.enable();
      gridster.enable_resize();
    }
    else{
      $("body").css("margin-left","0px");
      widget.find(".mask").css('display', 'flex');
      $(".btnMenu").hide();
      curScroll=$(".gridster").scrollTop();
      $(".gridster").css("overflow","hidden");
      $(".gridster").scrollTop(0);
      $(".close-widget").css('display', 'none');
      widget.addClass("maximized");
      $(".maximized").attr("style2",$(".maximized").attr("style"))
      $(".maximized").attr("style",$(".maximized").attr("style")+"height:"+($(".grid").height()) +'px!important')
      gridster.disable();
      gridster.disable_resize();
      setTimeout(() => {
        widget.find(".mask").fadeOut(MASK_DELAY);
      }, MASK_DELAY);
    }
    setTimeout(() => {
      var w=getTabVizFromWidget(widget);
      if(w!=null)
        resizeViz(w);
    }, 310);
  }
  function addEmptyWidget(){
    gridster.add_widget.apply(gridster, [`<li class="empty" id="${getUniqueID()}">${getEmptyNodeTemplate()}</li>`, 13, 5,1,1]);
    MicroModal.close('modal-1');
    editMode(true);
    storeGrid();
  }
  function addWidgetToGrid(chartID){
    curNew=getUniqueID();
    gridster.add_widget.apply(gridster, [`<li id="${curNew}" style="margin-top: auto; margin-bottom: auto; min-height: auto;">NEW</li>`, mobileCheck()==true?60:30, 16,1,1,null,false]);
    var nid=getUniqueID()
    var tp=getNodeTemplate(nid,chartID)
    $(`#${curNew}`).empty();
    $(`#${curNew}`).html(tp);
    setTimeout(() => {
      gridResize();
      setTimeout(() => {
        loadVizInit(chartID,nid);
      }, 1000);
    }, 1000);
    editMode(true);
    packGrid();
    storeGrid();
  }
  function addWidgetFromList(url=null){
    if(url!=null){
      $(".thumb_btn").addClass("spin");
      setTimeout(() => {
        $(".thumb_btn").removeClass("spin");
         addWidgetToGrid(url);
      }, 1000);
    }
  }
  function addWidget(){
    var text=$("#shareCode").val();
    var dom = $.parseHTML( text );
    var $dom = $( dom );
    var tmp=decodeURIComponent($dom.find( "param[name='host_url']" ).attr('value'));
    var host = tmp.substring(0,tmp.lastIndexOf("/"));
    var site = $dom.find( "param[name='site_root']" ).attr('value') ;
    var view = $dom.find( "param[name='name']" ).attr('value') ;
    var path = $dom.find( "param[name='path']" ).attr('value') ;
    var chartID=decodeURIComponent(`${host}${site}/views/${view}`)
    if(typeof(path)!='undefined')
      chartID=decodeURIComponent(`${host}/${path}`)
    var staticIMG=$dom.find( "param[name='static_image']" ).attr('value') ;
    MicroModal.close('modal-1');
    addWidgetToGrid(chartID);
  }
  function removeWidget(){
    var vizzes=tableau.VizManager.getVizs();
    var id=widToDel.find(".tableauPlaceholder").attr("id");
    var idTodel;
    for(b=0;b<vizzes.length;b++){
      if($(vizzes[b].getParentElement()).attr("id")==id)
        idTodel=b;
    }
    vizzes[idTodel].dispose();
    gridster.remove_widget(widToDel,()=>{
      storeGrid();
      MicroModal.close('modal-2');
      packGrid();
      setTimeout(() => {
        gridResize();
      }, 1000);
    });

  }
  function storeGrid(){
    var edt=localStorage.getItem("EDIT_URL");
    var ask=localStorage.getItem("ASK_URL");
    var snew=localStorage.getItem("SAMPLE_NEW");
    var sync=localStorage.getItem("SYNC_FILTERS");
    localStorage.clear();
    localStorage.setItem("VERSION",VERSION);
    localStorage.setItem("SYNC_FILTERS",sync);
    if(ask!="" && ask!=null)
      localStorage.setItem("ASK_URL",ask);
    if(edt!="" && edt!=null)  
      localStorage.setItem("EDIT_URL",edt);
    if(snew!=null)
      localStorage.setItem("SAMPLE_NEW",snew); 
    $( ".gridster li:not(.preview-holder)" ).each(function( index ) {
      if(!$(this).hasClass("notrans")){//IT IS NOT ASKDATA OR WEB EDIT
        var iteID=getUniqueID();
        var rowID=$(this).attr("data-row");
        var colID=$(this).attr("data-col");
        var sizeX=$(this).attr("data-sizex");
        var sizeY=$(this).attr("data-sizey");
        var chartName=$(this).find(".tableauPlaceholder").attr('chart');
        if($(this).find(".drag_handle").hasClass("empty"))
          chartName="empty"
        localStorage.setItem(getUniqueID(),`${rowID}#${colID}#${sizeX}#${sizeY}#${chartName}#${iteID}`);
      }
    });
  }
  function getSavedWidgetsInfo(){
    var arrNode=[]
    for (var i = 0; i < localStorage.length; i++){
      if(localStorage.key(i).substring(0,1)=="_"){
        var settings=localStorage.getItem(localStorage.key(i)).split('#');
        arrNode.push({id:localStorage.key(i),row:settings[0],col:settings[1],sizeX:settings[2],sizeY:settings[3],chartName:settings[4],vizID:settings[5]})
      }
    }
    arrNode=arrNode.sort(function(a, b) {
      a.row=parseInt(a.row);a.col=parseInt(a.col);b.row=parseInt(b.row);b.col=parseInt(b.col);
      if (a.row > b.row || a.row === b.row && a.col > b.col) {
        return 1;
      }
      return -1;
    });
    return arrNode;
  }
  function restoreGrid(){
    var arrNode=getSavedWidgetsInfo();
    arrNode.map((e)=>{
      $(".gridster ul").append(`<li id="${e.id}" data-col="${e.col}" data-row="${e.row}" data-sizex="${e.sizeX}" data-sizey="${e.sizeY}"></li>`);
      if(e.chartName!="empty"){
        var tp=getNodeTemplate(e.vizID,e.chartName);
        $(`#${e.id}`).empty();
        $(`#${e.id}`).html(tp);
      }
      else{
        $(`#${e.id}`).empty();
        $(`#${e.id}`).html(getEmptyNodeTemplate());
      }
    })
    arrNode.map((e)=>{
      setTimeout(() => {
        loadVizInit(e.chartName,e.vizID);
      }, 1000);
    })
  }
  function getEmptyNodeTemplate(){
    var it=`
          <div class="empty drag_handle hide"><i class="ico-handle fa fa-arrows-alt"></i></div>
          <div class="close-widget" onclick="tabportal.removeWidget(event)"><i class="ico-handle fa fa-close"></i></div>
          <span class="gs-resize-handle gs-resize-handle-both"></span> 
    `;
    return it;
  }
  function getNodeTemplate(genID,chartName){
    var tp=`
        <div class="drag_handle hide">
          <div class="close-widget" onclick="tabportal.showModal('modal-2',event)"><i class="ico-handle fa fa-times"></i></div>
          <div class="reset-widget" onclick="tabportal.resetFilters()"><i class="ico-handle fa fa-sync"></i></div>
          <div class="expand-widget" onclick="tabportal.expandWidget(event)"><i class="ico-handle fa fa-expand-alt"></i></div>
        </div>
        <div class="tab-widget">
          <div class='tableauPlaceholder' chart="${chartName}" id='${genID}' style='width: 100%; height: 100%'>
          </div>
          <div class="mask">
            <div class="loading-wrapper">
              <div class="loading-devover">
              </div>
            </div>
          </div> 
        </div>
        <span class="gs-resize-handle gs-resize-handle-both"></span> 
    `
    return tp;
  }
  function  getUniqueID() {
    return '_' + Math.random().toString(36).substr(2, 9);
  };
  function mobileCheck() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };
  function loadVizInit(url,id) {
    var urlView=`${url}?:showVizHome=no&:embed=true`;
    var placeholderView = document.getElementById(id);
    var optView = {
      onFirstVizSizeKnown:function(me){
      },
      onFirstInteractive: function (me) {
        me.getViz().addEventListener(tableau.TableauEventName.MARKS_SELECTION, onMarksSelection);
        if(me.getViz().getWorkbook().getActiveSheet().getSheetType()==tableau.SheetType.DASHBOARD && me.getViz().getWorkbook().getActiveSheet().getSize().behavior!=tableau.SheetSizeBehavior.AUTOMATIC)
          resizeViz(getTabVizFromWidget($(placeholderView).parent().parent()));
        else  
          hideMask(placeholderView);    
      },
      width: $(placeholderView).width(),
      height: $(placeholderView).height(),
      hideTabs: true,
      hideToolbar: true
    };
    //fallback if not authenticated
    setTimeout(() => {
      hideMask(placeholderView);
    }, 10000);
    loadViz(placeholderView, urlView, optView);
  }
  function loadViz(placeholderDiv, url, options) {
    var v=new tableau.Viz(placeholderDiv, url, options);
  }
  async function onFilter(filters) {
    var ff=await filters.getFilterAsync();
    var values=ff.getAppliedValues().map((v)=>{
      return v.value;
    })
    if(values>0)
      activeSheet.applyFilterAsync(ff.getFieldName(),values,tableau.FilterUpdateType.REPLACE);
    else
      activeSheet.applyFilterAsync(ff.getFieldName(),"",tableau.FilterUpdateType.ALL);
  }
  function resetFilters(){
    var vizzes=tableau.VizManager.getVizs();
    var all=[];
    for(b=0;b<vizzes.length;b++){
      //vizzes[b].revertAllAsync();
      workbook = vizzes[b].getWorkbook();
      activeSheet = workbook.getActiveSheet();
      if(activeSheet.getSheetType()==tableau.SheetType.DASHBOARD )
        activeSheet.getWorksheets()[0].clearSelectedMarksAsync(); 
      else{
        activeSheet.clearSelectedMarksAsync();
      }
      for(var i in curFilters){
        all.push(activeSheet.applyFilterAsync(i,"",tableau.FilterUpdateType.ALL));
      }
      Promise.all(all,()=>{
        curFilters={};
      })
    }
  }
  function resetFilters2(){
    var vizzes=tableau.VizManager.getVizs();
      for(b=0;b<vizzes.length;b++){
        //vizzes[b].revertAllAsync();
        workbook = vizzes[b].getWorkbook();
        activeSheet = workbook.getActiveSheet();
        activeSheet.applyFilterAsync("Category Name","Null",tableau.FilterUpdateType.REPLACE,{isExcludeMode:true});  
        activeSheet.applyFilterAsync("Project","",tableau.FilterUpdateType.ALL);
        activeSheet.getWorksheets()[0].clearSelectedMarksAsync();
      }
  }
  function onMarksSelection2(marksEvent) {
    var mk=[];
    var mk2=[];
    marksEvent.getMarksAsync().then((curmarks)=>{
      for (var markIndex = 0; markIndex < curmarks.length; markIndex++) {
        var pairs = curmarks[markIndex].getPairs();
        for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
            var pair = pairs[pairIndex]; 
            if(pair.fieldName=="Name")
              mk.push(pair.value)
            if(pair.fieldName=="Category Name")
              mk2.push(pair.value)  
        }
      }
      var vizzes=tableau.VizManager.getVizs();
      for(b=0;b<vizzes.length;b++){
        workbook = vizzes[b].getWorkbook();
        activeSheet = workbook.getActiveSheet();
        if(mk.length>0)
          activeSheet.applyFilterAsync("Name",mk,tableau.FilterUpdateType.REPLACE);
        
        if(mk2.length>0)
          activeSheet.applyFilterAsync("Category Name",mk2,tableau.FilterUpdateType.REPLACE);

        if(mk2.length==0 && mk.length==0){
          activeSheet.applyFilterAsync("Category Name","Null",tableau.FilterUpdateType.REPLACE,{isExcludeMode:true});  
          activeSheet.applyFilterAsync("Name","",tableau.FilterUpdateType.ALL);
        }
      }
    });
  }
  function onMarksSelection(marksEvent) {
    if(getSyncSetting()==false)
      return;
    var mk={};
    curWB=marksEvent.getViz().getWorkbook().getName();
    marksEvent.getMarksAsync().then((curmarks)=>{
      for (var markIndex = 0; markIndex < curmarks.length; markIndex++) {
        var pairs = curmarks[markIndex].getPairs();
        for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
            var pair = pairs[pairIndex]; 
            var found=false;
            for(var i in mk){
                if( i==pair.fieldName){
                  found=true;
                  break;
                }
            }
            if(found==false && isNaN(pair.value)){
              mk[pair.fieldName]=[]
            }
            if(isNaN(pair.value) && !mk[pair.fieldName].includes(pair.value))
              mk[pair.fieldName].push(pair.value);
        }
      }
      var vizzes=tableau.VizManager.getVizs();
      if(!$.isEmptyObject(mk))
        for(b=0;b<vizzes.length;b++){
          workbook = vizzes[b].getWorkbook();
          if(true || curWB==workbook.getName()){
            activeSheet = workbook.getActiveSheet();
            for(var i in mk){
              activeSheet.applyFilterAsync(i,mk[i],tableau.FilterUpdateType.REPLACE);
            }
          }
        }
      if(!$.isEmptyObject(mk)){
        curFilters=mk;
      }
      else{
        resetFilters();
      }
    });
  }
  function setMenuState(){
    var edurl=localStorage.getItem("EDIT_URL");
    var askurl=localStorage.getItem("ASK_URL");
    $(".askFeat").removeClass("disable");
    $(".editFeat").removeClass("disable");
    $(".askFeat").attr("title","Ask Data");
    $(".editFeat").attr("title","Web Edit");
    if(askurl==null){
      $(".askFeat").addClass("disable");
      $(".askFeat").attr("title","Configure ASK DATA URL in the Settings");
    }
    if(edurl==null){
      $(".editFeat").addClass("disable");
      $(".editFeat").attr("title","Configure WEB EDIT URL in the Settings");
    }
  }
  function specialWidget(type){
    setMenuState();
    var url=localStorage.getItem(`${type.toUpperCase()}_URL`)
    if(url!=null && url!="")
      openSpecialWidget(type,url);
  }
  function openSpecialWidget(type,url){
    mustScrollTop=true;
    $("body").css("margin-left","0");
    if(tabportal[type+"Loaded"]==false){
      $(".gridster").on("scroll",scrollTopFix);
      tabportal[type+"Loaded"]=true;
      var wid=gridster.add_widget.apply(gridster, [`
      <li id="${getUniqueID()}" class="notrans" style="background-color:#eaeaea;transition:0!important;margin-top: auto; margin-bottom: auto; min-height: auto;">
        <div class="close-data ${type}Close" onclick="tabportal.closeWidget('${type}')"><i class="ico-handle fa fa-times"></i></div>
        <iframe class="${type}Ifr" style="border-width: 0px;" width="100%" height="100%" src="${url}"></iframe>
        <div class="mask">
          <div class="loading-wrapper">
            <div class="loading-devover">
            </div>
          </div>
        </div> 
      </li>
      `, 30, 16,1,1,20,15,null,false]);
      tabportal[type+"Widget"]=wid;
      _expandWidget(wid);
    }
    else{
      MASK_DELAY=500;
      var wid=gridster.add_widget.apply(gridster, [this.tabportal[type+"Widget"]
      , 30, 16,1,1,20,15,null,true]);
      this.tabportal[type+"Widget"]=wid;
      _expandWidget(wid);
    }
  }
  function closeWidget(type,silent=false){
    if(tabportal[type+"Widget"]){
      mustScrollTop=false;
      $("body").css("margin-left","15px");
      MASK_DELAY=MASK_DELAY_INIT;
      tabportal[type+"Widget"].removeClass("maximized")
      gridster.remove_widget(tabportal[type+"Widget"],false,()=>{
        $(".btnMenu").show();
        $(".gridster").css("overflow","auto");
        $(".gridster").scrollTop(0);
        $(".close-widget").css('display', 'flex');
        gridster.set_dom_grid_width();
      },true);
      gridster.enable_resize();
      gridster.enable();
      if(silent==false)
        setTimeout(() => {
          gridResize();
        }, 1000);
    }
  };
  function scrollTopFix(){
    if(mustScrollTop==true)
      $(".gridster").scrollTop(0);
  }
  function getSyncSetting(){
    var tr=localStorage.getItem("SYNC_FILTERS");
    tr=="true"?tr=true:tr=false;
    return tr;
  }
  function showSettings(){
    $("body").css("margin-left","0px");
    $(".btnMenu").hide();
    $("#sync").prop( "checked",getSyncSetting());
    $("#ask").val(localStorage.getItem("ASK_URL"))
    $("#wedit").val(localStorage.getItem("EDIT_URL"))
    MicroModal.show("modal-3",{onClose:()=>{$(".btnMenu").show();$("body").css("margin-left","15px");gridResize()}});
    $(".gogo").focus();
  }
  function saveSettings(){
    localStorage.setItem("SYNC_FILTERS",$("#sync").prop( "checked"));
    localStorage.setItem("ASK_URL",$("#ask").val());
    localStorage.setItem("EDIT_URL",$("#wedit").val());
    MicroModal.close('modal-3');
    if($("#ask").val()=="")
      localStorage.removeItem("ASK_URL");
    if($("#wedit").val()=="")
      localStorage.removeItem("EDIT_URL");
    setMenuState() ; 
    if(localStorage.getItem("ASK_URL")!=null)
      $(".askIfr").attr("src",localStorage.getItem("ASK_URL"));
    if(localStorage.getItem("EDIT_URL")!=null) 
      $(".editIfr").attr("src",localStorage.getItem("EDIT_URL")); 
  }
  function saveToFile(){
    var text=JSON.stringify(localStorage);
    var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    var d = new Date();
    var datestring = ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
    d.getFullYear() + "--" + ("0" + d.getHours()).slice(-2) + "h" + ("0" + d.getMinutes()).slice(-2);
    saveAs(blob, "myConfig_"+datestring+".tabw");
  }
  function loadPredefined(url){
    var tbTemplate=`<div class="thumbn" style="height:100px;width:100px"> </div>`
    return new Promise((resolve,reject)=>{
      fetch(url+'.tabw')
      .then((response) => {
        return response.json();
      }).then((data) => {
        for (var name in data) {
          $("#predefined").append(
            `<div class="thumbn"> 
                <div class="thumb_text">${name}</div>
                <img class="thumb_pic" src="${data[name]}?:embed=y&:showVizHome=no&:format=png&:embed=y" />
                <div class="thumb_btn thumb_btn_txt" onclick="tabportal.addWidgetFromList('${data[name]}')">
                  Insert
                </div>
            </div>`
          );
        }
        $('details').click(function (event) {
          $('details').not(this).removeAttr("open");  
        });
        resolve();
      });
    })
  }
  function restoreFromUrl(url,reload=true){
    return new Promise((resolve,reject)=>{
      fetch(url+'.tabw')
      .then((response) => {
        return response.json();
      }).then((data) => {
        localStorage.clear();
        for (var name in data) {
            localStorage.setItem(name, data[name] );
        }
        if(reload==true)
          reloadMe(); 
        resolve();
      });
    })
  }
  function restoreFromFile(files) {
    for (var i = 0, f; f = files[i]; i++) {
        var fr=new FileReader();
        fr.onload = function(e) {
            try {
              var storage = JSON.parse(e.target.result);
            }catch(err){
              alert("File content is wrong...");
              return;
            }
            localStorage.clear();
            for (var name in storage) {
                localStorage.setItem(name, storage[name] );
            }
        };
        fr.readAsText(f);
        reloadMe();
    }
  };
  function reloadMe(){
    var start=4;
    $(".text_drop").css("color","#4d5ee0");
    $(".text_drop").css("font-weight","bolder");
    $(".text_drop").text(`Grid will reload in ${start} seconds !`);
    setInterval(() => {
      start=start-1;
      $(".text_drop").text(`Grid will reload in ${start} second${start>1?"s !":"  !"}`);
    }, 1000);
    setTimeout(() => {
      window.location.reload();
    }, 4500);
  }
  function filterWidgetList(){
    var fil=$("#search").val().toUpperCase();
    $(".thumbn").each((i,el)=>{
      if($(el).find(".thumb_text").text().toUpperCase().indexOf(fil)!=-1){
        $(el).show();
      }
      else{
        $(el).hide();
      }  
    })
  }
  window.tabportal={};
  window.tabportal.DEFAULT_SAMPLE=DEFAULT_SAMPLE;
  window.tabportal.addWidgetFromList=addWidgetFromList;
  window.tabportal.filterWidgetList=filterWidgetList;
  window.tabportal.restoreFromUrl=restoreFromUrl;
  window.tabportal.askLoaded=askLoaded;
  window.tabportal.saveToFile=saveToFile;
  window.tabportal.editLoaded=editLoaded;
  window.tabportal.askWidget=askWidget;
  window.tabportal.editWidget=editWidget;
  window.tabportal.saveSettings=saveSettings;
  window.tabportal.showSettings=showSettings;
  window.tabportal.specialWidget=specialWidget;
  window.tabportal.closeWidget=closeWidget;
  window.tabportal.editMode=editMode;
  window.tabportal.resetFilters=resetFilters;
  window.tabportal.gridize=gridize;
  window.tabportal.showModal=showModal;
  window.tabportal.addWidget=addWidget;
  window.tabportal.removeWidget=removeWidget;
  window.tabportal.addEmptyWidget=addEmptyWidget;
  window.tabportal.expandWidget=expandWidget;
  
})(window)