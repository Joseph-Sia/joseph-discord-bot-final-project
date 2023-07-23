$(document).ready(function() {
    //calcuate the total height of the categories
    let total_height = 0;
    $("li[data-category]").each(function() {
      total_height += $(this).outerHeight();
    });
    //set the height of li.commands-info the same with the total height of the categories li
    $("li.commands-info").height(total_height - 18);

    // At first, only show the first command
    $("li[data-command]").hide();
    $("li.qr-command").hide();
    $("li[data-command]:first").show();
    $("li[data-category]:first").addClass("active");
    $("li.commands-info").show(); //show the li when the page starts

    // When a category is clicked...
    $("li[data-category]").click(function() {
      // Hide all commands
      $("li[data-command]").hide();
      $("li.commands-info").hide(); //when a category li is being clicked, this command-info li will hide
      $("li.qr-command").hide();
      $("li[data-category]").removeClass("active");
      $(this).addClass("active");

      // Show the command with the same name as the clicked category
      var categoryName = $(this).attr("data-category");
      $("li[data-command='" + categoryName + "']").show();

      // if the command info is clicked, we want it show the lastestguild.prefix and latestguild.guildId
      if (categoryName === "Prefix") {
        $("li.commands-info").show(); //when the prefix category li is being clicked, this command-info li will show
     
      }

      else if (categoryName === "QR Code") {
        $("li.qr-command").show();
      }

    });
});